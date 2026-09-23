import { Routes, Route } from "react-router-dom";
import TodoAI from "@/pages/TodoAI";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TodoAI />} />
      <Route path="/todo-ai" element={<TodoAI />} />
    </Routes>
  );
}
