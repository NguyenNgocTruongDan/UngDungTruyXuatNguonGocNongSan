import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:app/core/router.dart';
import 'package:app/core/theme.dart';

void main() {
  runApp(const ProviderScope(child: AgriTraceApp()));
}

class AgriTraceApp extends StatelessWidget {
  const AgriTraceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriTrace',
      theme: appTheme,
      debugShowCheckedModeBanner: false,
      onGenerateRoute: AppRouter.generateRoute,
      initialRoute: AppRouter.home,
    );
  }
}




