package com.example.myapplication.ui.map

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.commit
import androidx.fragment.app.setFragmentResultListener
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.example.myapplication.BuildConfig
import com.example.myapplication.R
import com.example.myapplication.SmartTripApplication
import com.example.myapplication.databinding.FragmentMapBinding
import com.example.myapplication.domain.model.LocationPoint
import com.example.myapplication.ui.favorites.FavoritesFragment
import com.example.myapplication.utils.LocationPermissionHelper
import com.example.myapplication.utils.MarkerIconFactory
import com.example.myapplication.utils.MotionSensorManager
import com.example.myapplication.utils.playPressAnimation
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.material.snackbar.Snackbar
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.launch

class MapFragment : Fragment(), OnMapReadyCallback {
    private var _binding: FragmentMapBinding? = null
    private val binding get() = _binding!!

    private val viewModel: MapViewModel by viewModels {
        val appContainer = (requireActivity().application as SmartTripApplication).appContainer
        MapViewModelFactory(
            appContainer.authRepository,
            appContainer.placesRepository,
            appContainer.weatherRepository
        )
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var motionSensorManager: MotionSensorManager
    private var googleMap: GoogleMap? = null

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.values.any { it }) {
            enableMyLocation()
            requestBalancedLocation()
        } else {
            Snackbar.make(binding.root, "Location permission is required for nearby exploration.", Snackbar.LENGTH_LONG).show()
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMapBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireActivity())
        motionSensorManager = MotionSensorManager(requireContext()) { isMoving ->
            viewModel.onMotionChanged(isMoving)
        }

        ensureMapFragment()
        setupActions()
        listenForFavoriteSelections()
        observeState()

        if (BuildConfig.MAPS_API_KEY.isBlank()) {
            Snackbar.make(binding.root, getString(R.string.map_api_missing), Snackbar.LENGTH_LONG).show()
        }
    }

    override fun onResume() {
        super.onResume()
        motionSensorManager.start()
    }

    override fun onPause() {
        motionSensorManager.stop()
        super.onPause()
    }

    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        map.uiSettings.isCompassEnabled = true
        map.uiSettings.isMapToolbarEnabled = false
        map.setOnMapClickListener { latLng ->
            viewModel.onMapTapped(latLng.latitude, latLng.longitude)
            moveCamera(latLng)
        }

        if (LocationPermissionHelper.hasLocationPermission(requireContext())) {
            enableMyLocation()
            requestBalancedLocation()
        } else {
            permissionLauncher.launch(LocationPermissionHelper.permissions)
        }
    }

    private fun ensureMapFragment() {
        val fragment = childFragmentManager.findFragmentById(R.id.map_container) as? SupportMapFragment
        if (fragment != null) {
            fragment.getMapAsync(this)
            return
        }

        childFragmentManager.commit {
            replace(R.id.map_container, SupportMapFragment.newInstance())
        }
        childFragmentManager.executePendingTransactions()
        (childFragmentManager.findFragmentById(R.id.map_container) as? SupportMapFragment)
            ?.getMapAsync(this)
    }

    private fun setupActions() {
        binding.savePlaceButton.setOnClickListener {
            it.playPressAnimation()
            viewModel.saveSelectedPlace()
        }

        binding.shareButton.setOnClickListener {
            it.playPressAnimation()
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, viewModel.buildShareText())
            }
            startActivity(Intent.createChooser(shareIntent, getString(R.string.share_location)))
        }

        binding.recenterButton.setOnClickListener {
            it.playPressAnimation()
            val currentLocation = viewModel.uiState.value.currentLocation
            if (currentLocation != null) {
                moveCamera(LatLng(currentLocation.lat, currentLocation.lng))
                viewModel.onMapTapped(currentLocation.lat, currentLocation.lng)
            } else {
                requestBalancedLocation()
            }
        }
    }

    private fun observeState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.uiState.collect { state ->
                        binding.locationProgress.isVisible = state.isLoadingLocation
                        binding.weatherText.text = formatWeather(state)
                        binding.motionStatusText.text = if (state.isDeviceMoving) {
                            getString(R.string.device_motion_active)
                        } else {
                            getString(R.string.device_motion_idle)
                        }

                        if (state.isDeviceMoving) {
                            binding.recenterButton.playPressAnimation()
                        }

                        renderMarkers(state)
                    }
                }

                launch {
                    viewModel.messages.collect { message ->
                        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private fun listenForFavoriteSelections() {
        setFragmentResultListener(FavoritesFragment.MAP_SELECTION_REQUEST_KEY) { _, bundle ->
            val lat = bundle.getDouble(FavoritesFragment.KEY_LAT)
            val lng = bundle.getDouble(FavoritesFragment.KEY_LNG)
            viewModel.onMapTapped(lat, lng)
            moveCamera(LatLng(lat, lng))
        }
    }

    private fun requestBalancedLocation() {
        if (!LocationPermissionHelper.hasLocationPermission(requireContext())) {
            permissionLauncher.launch(LocationPermissionHelper.permissions)
            return
        }

        viewModel.setLocationLoading(true)
        val request = CurrentLocationRequest.Builder()
            .setPriority(Priority.PRIORITY_BALANCED_POWER_ACCURACY)
            .setMaxUpdateAgeMillis(60_000)
            .build()

        fusedLocationClient.getCurrentLocation(request, CancellationTokenSource().token)
            .addOnSuccessListener { location ->
                if (location != null) {
                    viewModel.onCurrentLocationReceived(location.latitude, location.longitude)
                    moveCamera(LatLng(location.latitude, location.longitude))
                } else {
                    viewModel.setLocationLoading(false)
                    Toast.makeText(requireContext(), "Unable to determine the current location.", Toast.LENGTH_SHORT).show()
                }
            }
            .addOnFailureListener {
                viewModel.setLocationLoading(false)
                Snackbar.make(binding.root, "Location request failed.", Snackbar.LENGTH_LONG).show()
            }
    }

    private fun enableMyLocation() {
        if (!LocationPermissionHelper.hasLocationPermission(requireContext())) return
        googleMap?.isMyLocationEnabled = true
    }

    private fun renderMarkers(state: MapUiState) {
        val map = googleMap ?: return
        map.clear()

        state.currentLocation?.let { location ->
            map.addMarker(
                MarkerOptions()
                    .position(LatLng(location.lat, location.lng))
                    .title(getString(R.string.current_location))
                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE))
            )
        }

        state.favorites.forEach { favorite ->
            map.addMarker(
                MarkerOptions()
                    .position(LatLng(favorite.lat, favorite.lng))
                    .title(favorite.name)
                    .icon(MarkerIconFactory.fromVector(requireContext(), R.drawable.ic_trip_marker))
            )
        }

        state.selectedLocation?.let { selected ->
            map.addMarker(
                MarkerOptions()
                    .position(LatLng(selected.lat, selected.lng))
                    .title(getString(R.string.selected_location))
                    .icon(MarkerIconFactory.fromVector(requireContext(), R.drawable.ic_trip_marker))
            )
        }
    }

    private fun moveCamera(latLng: LatLng) {
        googleMap?.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 14f))
    }

    private fun formatWeather(state: MapUiState): String {
        val weatherInfo = state.weatherInfo
        return if (weatherInfo == null) {
            state.weatherStatus.ifBlank { getString(R.string.weather_placeholder) }
        } else {
            "${weatherInfo.temperatureCelsius.toInt()}°C · ${weatherInfo.condition}"
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
