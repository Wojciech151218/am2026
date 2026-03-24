package com.example.myapplication.ui.auth

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.NavOptions
import androidx.navigation.fragment.findNavController
import com.example.myapplication.R
import com.example.myapplication.SmartTripApplication
import com.example.myapplication.databinding.FragmentRegisterBinding
import com.example.myapplication.utils.playPressAnimation
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

class RegisterFragment : Fragment() {
    private var _binding: FragmentRegisterBinding? = null
    private val binding get() = _binding!!

    private val viewModel: AuthViewModel by viewModels {
        val appContainer = (requireActivity().application as SmartTripApplication).appContainer
        AuthViewModelFactory(appContainer.authRepository)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentRegisterBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.registerButton.setOnClickListener {
            it.playPressAnimation()
            viewModel.register(
                email = binding.emailInput.editText?.text.toString(),
                password = binding.passwordInput.editText?.text.toString()
            )
        }

        binding.goToLoginButton.setOnClickListener {
            findNavController().navigateUp()
        }

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.uiState.collect { state ->
                        binding.registerProgress.visibility =
                            if (state.isLoading) View.VISIBLE else View.GONE
                        binding.registerButton.isEnabled = !state.isLoading
                        binding.goToLoginButton.isEnabled = !state.isLoading

                        if (state.isAuthenticated &&
                            findNavController().currentDestination?.id == R.id.registerFragment
                        ) {
                            navigateToMain()
                        }
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

    private fun navigateToMain() {
        val options = NavOptions.Builder()
            .setPopUpTo(findNavController().graph.startDestinationId, true)
            .build()
        findNavController().navigate(R.id.mapFragment, null, options)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
