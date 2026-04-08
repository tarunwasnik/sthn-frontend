//frontend/src/routes/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import EntryLoader from "../pages/EntryLoader";
import AdminEntryPlaceholder from "../pages/admin/AdminEntry";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/entry" element={<EntryLoader />} />
      <Route path="/admin/entry" element={<AdminEntryPlaceholder />} />

      {/* Temporary placeholders */}
      <Route path="/creator" element={<div>Creator Home</div>} />
      <Route path="/home" element={<div>User Home</div>} />
    </Routes>
  );
};

export default AppRoutes;
