import 'package:flutter/material.dart';

class AppColors {
  static const forest = Color(0xFF0F1A35);
  static const pine = Color(0xFF4A7DFF);
  static const leaf = Color(0xFF68D9FF);
  static const moss = Color(0xFFDCE7FF);
  static const wheat = Color(0xFFECE1FF);
  static const canvas = Color(0xFFF4F7FF);
  static const ink = Color(0xFF121B34);
  static const muted = Color(0xFF6A7591);
  static const danger = Color(0xFFD65C74);
  static const glassFill = Color(0xB8FFFFFF);
  static const glassLine = Color(0xD6FFFFFF);
}

final appTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.pine,
    primary: AppColors.pine,
    secondary: AppColors.leaf,
    tertiary: AppColors.wheat,
    surface: Colors.white,
    error: AppColors.danger,
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: AppColors.canvas,
  canvasColor: AppColors.canvas,
  dividerColor: Colors.white.withValues(alpha: 0.6),
  splashColor: Colors.white.withValues(alpha: 0.08),
  textTheme: const TextTheme(
    displaySmall: TextStyle(
      fontSize: 34,
      fontWeight: FontWeight.w800,
      letterSpacing: -1.2,
      color: AppColors.ink,
      height: 1.02,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w800,
      letterSpacing: -0.9,
      color: AppColors.ink,
    ),
    headlineSmall: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w700,
      letterSpacing: -0.4,
      color: AppColors.ink,
    ),
    titleLarge: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w700,
      color: AppColors.ink,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w700,
      color: AppColors.ink,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      height: 1.5,
      color: AppColors.ink,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      height: 1.5,
      color: AppColors.muted,
    ),
    labelLarge: TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w700,
      color: Colors.white,
    ),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: Colors.transparent,
    foregroundColor: AppColors.ink,
    centerTitle: false,
    elevation: 0,
    scrolledUnderElevation: 0,
    titleTextStyle: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w800,
      color: AppColors.ink,
    ),
  ),
  cardTheme: CardThemeData(
    color: AppColors.glassFill,
    elevation: 0,
    surfaceTintColor: Colors.transparent,
    shadowColor: const Color(0x330B1A4A),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(30),
      side: BorderSide(
        color: Colors.white.withValues(alpha: 0.58),
      ),
    ),
    margin: EdgeInsets.zero,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white.withValues(alpha: 0.46),
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
    labelStyle: const TextStyle(color: AppColors.muted),
    hintStyle: TextStyle(color: AppColors.muted.withValues(alpha: 0.9)),
    prefixIconColor: AppColors.pine,
    suffixIconColor: AppColors.muted,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: BorderSide(
        color: Colors.white.withValues(alpha: 0.62),
      ),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: BorderSide(
        color: Colors.white.withValues(alpha: 0.62),
      ),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppColors.pine, width: 1.4),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppColors.danger),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: AppColors.danger, width: 1.4),
    ),
  ),
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: AppColors.pine,
      foregroundColor: Colors.white,
      minimumSize: const Size.fromHeight(56),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
      ),
      textStyle: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
      elevation: 0,
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      elevation: 0,
      backgroundColor: Colors.white.withValues(alpha: 0.34),
      foregroundColor: AppColors.ink,
      minimumSize: const Size.fromHeight(56),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
      ),
      textStyle: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      minimumSize: const Size.fromHeight(54),
      foregroundColor: AppColors.ink,
      backgroundColor: Colors.white.withValues(alpha: 0.18),
      side: BorderSide(
        color: Colors.white.withValues(alpha: 0.55),
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      textStyle: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
    ),
  ),
  chipTheme: ChipThemeData(
    labelStyle: const TextStyle(
      color: AppColors.ink,
      fontWeight: FontWeight.w700,
    ),
    side: BorderSide.none,
    color: WidgetStatePropertyAll(
      Colors.white.withValues(alpha: 0.34),
    ),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(999),
    ),
  ),
);
