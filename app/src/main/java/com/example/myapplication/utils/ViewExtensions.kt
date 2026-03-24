package com.example.myapplication.utils

import android.view.View
import android.view.animation.AnimationUtils
import com.example.myapplication.R

fun View.playPressAnimation() {
    startAnimation(AnimationUtils.loadAnimation(context, R.anim.button_press))
}
