// Add this import at the top
import { Fab } from './Fab'; // Or create a simple button

// Add this inside the return, before BottomNav
{/* Compose Button */}
<TouchableOpacity
  style={local.fab}
  onPress={() => onNavigate('compose')}
  activeOpacity={0.8}
>
  <Text style={local.fabText}>✏️</Text>
</TouchableOpacity>

// Add these styles at the bottom of the file
const local = StyleSheet.create({
  // ... existing styles
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
  },
});