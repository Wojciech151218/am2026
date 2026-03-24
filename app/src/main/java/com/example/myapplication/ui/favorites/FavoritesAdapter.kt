package com.example.myapplication.ui.favorites

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.myapplication.databinding.ItemFavoritePlaceBinding
import com.example.myapplication.domain.model.FavoritePlace

class FavoritesAdapter(
    private val onPlaceClick: (FavoritePlace) -> Unit,
    private val onDeleteClick: (FavoritePlace) -> Unit
) : ListAdapter<FavoritePlace, FavoritesAdapter.FavoritePlaceViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FavoritePlaceViewHolder {
        val binding = ItemFavoritePlaceBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return FavoritePlaceViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FavoritePlaceViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class FavoritePlaceViewHolder(
        private val binding: ItemFavoritePlaceBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(place: FavoritePlace) {
            binding.placeName.text = place.name
            binding.placeCoordinates.text = "${place.lat}, ${place.lng}"
            binding.root.setOnClickListener { onPlaceClick(place) }
            binding.deleteButton.setOnClickListener { onDeleteClick(place) }
        }
    }

    private object DiffCallback : DiffUtil.ItemCallback<FavoritePlace>() {
        override fun areItemsTheSame(oldItem: FavoritePlace, newItem: FavoritePlace): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: FavoritePlace, newItem: FavoritePlace): Boolean {
            return oldItem == newItem
        }
    }
}
