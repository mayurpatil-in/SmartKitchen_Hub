import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    toasts: [], // list of active toast items: { id, type, message }
  },
  reducers: {
    addToast(state, action) {
      // payload matches structure: { type: 'success' | 'error' | 'warning' | 'info', message }
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      state.toasts.push({
        id,
        type: action.payload.type || 'info',
        message: action.payload.message || ''
      });
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts(state) {
      state.toasts = [];
    }
  },
});

export const { addToast, removeToast, clearAllToasts } = notificationSlice.actions;
export default notificationSlice.reducer;
