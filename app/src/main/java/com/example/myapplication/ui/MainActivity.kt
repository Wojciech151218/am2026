package com.example.myapplication.ui

import android.os.Bundle
import android.view.Menu
import android.view.MenuInflater
import android.view.MenuItem
import androidx.activity.addCallback
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.MenuProvider
import androidx.core.view.isVisible
import androidx.navigation.NavController
import androidx.navigation.NavOptions
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.navigateUp
import androidx.navigation.ui.setupWithNavController
import com.example.myapplication.R
import com.example.myapplication.SmartTripApplication
import com.example.myapplication.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity(), MenuProvider {
    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController
    private lateinit var appBarConfiguration: AppBarConfiguration

    private val appContainer by lazy {
        (application as SmartTripApplication).appContainer
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        addMenuProvider(this)

        val navHostFragment = supportFragmentManager.findFragmentById(R.id.nav_host_fragment)
            as NavHostFragment
        navController = navHostFragment.navController
        appBarConfiguration = AppBarConfiguration(setOf(R.id.mapFragment, R.id.favoritesFragment))

        binding.toolbar.setupWithNavController(navController, appBarConfiguration)
        binding.bottomNavigation.setupWithNavController(navController)

        navController.addOnDestinationChangedListener { _, destination, _ ->
            val showAppChrome = destination.id == R.id.mapFragment || destination.id == R.id.favoritesFragment
            binding.toolbar.isVisible = showAppChrome
            binding.bottomNavigation.isVisible = showAppChrome
            invalidateMenu()
        }

        onBackPressedDispatcher.addCallback(this) {
            if (!navController.navigateUp(appBarConfiguration)) {
                finish()
            }
        }
    }

    override fun onCreateMenu(menu: Menu, menuInflater: MenuInflater) {
        menuInflater.inflate(R.menu.top_app_bar_menu, menu)
    }

    override fun onPrepareMenu(menu: Menu) {
        val showLogout = navController.currentDestination?.id == R.id.mapFragment ||
            navController.currentDestination?.id == R.id.favoritesFragment
        menu.findItem(R.id.action_logout)?.isVisible = showLogout
    }

    override fun onMenuItemSelected(menuItem: MenuItem): Boolean {
        return when (menuItem.itemId) {
            R.id.action_logout -> {
                appContainer.authRepository.logout()
                navController.navigate(
                    R.id.loginFragment,
                    null,
                    NavOptions.Builder()
                        .setPopUpTo(navController.graph.id, true)
                        .build()
                )
                true
            }

            else -> false
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp(appBarConfiguration) || super.onSupportNavigateUp()
    }
}
