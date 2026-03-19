import 'package:app/main.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('app boots', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: AgriTraceApp()));
    expect(find.byType(AgriTraceApp), findsOneWidget);
  });
}
