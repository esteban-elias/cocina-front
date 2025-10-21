import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import '../../global.css';

export default function TabLayout() {
  return (
    <>
      <Tabs>
        <Tabs.Screen
          name='index'
          options={{
            title: 'Recetas',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="house" color={color} />,
          }}
        />
        <Tabs.Screen
          name='ingredients'
          options={{
            title: 'Ingredientes',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="shopping-basket" color={color} />,
          }}
        />
      </Tabs>
      <StatusBar style="auto" />
    </>
  );
}

