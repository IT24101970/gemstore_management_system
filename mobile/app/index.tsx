import RootNavigator from '../src/navigation/RootNavigator.js';
import {AuthProvider} from '../src/context/AuthContext.js'

export default function Index() {
  return (
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
  );
}