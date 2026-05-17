import { Routes, Route, createBrowserRouter, RouterProvider } from "react-router-dom";
import RealCakeCut from "./components/landingpage";
import Celebration from "./components/celebrationPage";
import TimeLinePhotos from "./components/timeline"
// import Celebration from "./pages/Celebration";
// import Memories from "./pages/Memories";

function App() {

  const route = createBrowserRouter([
    { path: "/", element: <RealCakeCut /> },
    { path: "/celebration", element: <Celebration /> },
    {path:"/memories",element:<TimeLinePhotos/>}
  ])
  return (
    <RouterProvider router={route} />
  );
}

export default App;