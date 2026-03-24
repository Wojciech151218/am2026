package com.example.myapplication.ui.favorites

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.os.bundleOf
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import com.example.myapplication.R
import com.example.myapplication.SmartTripApplication
import com.example.myapplication.databinding.FragmentFavoritesBinding
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

class FavoritesFragment : Fragment() {
    private var _binding: FragmentFavoritesBinding? = null
    private val binding get() = _binding!!

    private val viewModel: FavoritesViewModel by viewModels {
        val appContainer = (requireActivity().application as SmartTripApplication).appContainer
        FavoritesViewModelFactory(
            appContainer.authRepository,
            appContainer.placesRepository
        )
    }

    private val favoritesAdapter by lazy {
        FavoritesAdapter(
            onPlaceClick = { place ->
                parentFragmentManager.setFragmentResult(
                    MAP_SELECTION_REQUEST_KEY,
                    bundleOf(
                        KEY_LAT to place.lat,
                        KEY_LNG to place.lng,
                        KEY_NAME to place.name
                    )
                )
                findNavController().navigate(R.id.mapFragment)
            },
            onDeleteClick = { place ->
                viewModel.deleteFavorite(place.id)
            }
        )
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentFavoritesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        binding.favoritesRecyclerView.adapter = favoritesAdapter

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.uiState.collect { state ->
                        favoritesAdapter.submitList(state.favorites)
                        binding.emptyStateText.visibility =
                            if (state.favorites.isEmpty()) View.VISIBLE else View.GONE
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val MAP_SELECTION_REQUEST_KEY = "map_selection_request"
        const val KEY_LAT = "selected_lat"
        const val KEY_LNG = "selected_lng"
        const val KEY_NAME = "selected_name"
    }
}
