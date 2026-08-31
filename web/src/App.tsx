import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "@/pages/guest/HomePage";
import BookPage from "@/pages/guest/BookPage";
import SuccessPage from "@/pages/guest/SuccessPage";
import SchedulePage from "@/pages/guest/SchedulePage";
import GuestLayout from "@/pages/guest/GuestLayout";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminEventTypesPage from "@/pages/admin/AdminEventTypesPage";
import AdminEventTypeDetailPage from "@/pages/admin/AdminEventTypeDetailPage";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";
import NotFoundPage from "@/pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<GuestLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/book/:eventTypeId" element={<BookPage />} />
        <Route path="/book/:eventTypeId/success" element={<SuccessPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="event-types" replace />} />
        <Route path="event-types" element={<AdminEventTypesPage />} />
        <Route
          path="event-types/:eventTypeId"
          element={<AdminEventTypeDetailPage />}
        />
        <Route path="bookings" element={<AdminBookingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
