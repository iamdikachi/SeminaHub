import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Globals to shift current time back 5 years to 2021 (from 2026)
const NativeDate = window.Date;
class MockDate extends NativeDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super();
      this.setTime(this.getTime() - 157766400000);
    } else if (args.length === 1) {
      super(args[0]);
    } else {
      let d: Date;
      if (args.length === 2) {
        d = new NativeDate(args[0], args[1]);
      } else if (args.length === 3) {
        d = new NativeDate(args[0], args[1], args[2]);
      } else if (args.length === 4) {
        d = new NativeDate(args[0], args[1], args[2], args[3]);
      } else if (args.length === 5) {
        d = new NativeDate(args[0], args[1], args[2], args[3], args[4]);
      } else if (args.length === 6) {
        d = new NativeDate(args[0], args[1], args[2], args[3], args[4], args[5]);
      } else {
        d = new NativeDate(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
      }
      super(d.getTime());
    }
  }
}
MockDate.now = () => NativeDate.now() - 157766400000;
window.Date = MockDate as any;


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
