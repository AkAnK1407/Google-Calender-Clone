import { Toaster } from 'react-hot-toast';

import Calendar from './components/Calendar/Calendar';

const App = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <Calendar />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
};

export default App;
