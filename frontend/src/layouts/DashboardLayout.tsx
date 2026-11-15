import "../styles/DashboardLayout.css";
import Sidebar from "../components/shared/layout/Sidebar";
import Header from "../components/shared/layout/Header";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; //Import our custom state engine access key

import { adminSidebarMenu } from "../config/DashboardConfig";
import { learnerSidebarMenu } from "../config/DashboardConfig";
import { managerSidebarMenu } from "../config/DashboardConfig";
import { teacherSidebarMenu } from "../config/DashboardConfig";
import type { MenuItem } from "../config/DashboardConfig";

export default function DashboardLayout() {
  // Extract the live, authenticated user object from our global state provider
  const { user } = useAuth();

  // Establish our layout menu accumulator
  let currentMenu: MenuItem[];

  // 🔄 Check real database role strings (Handling fallback protections seamlessly)
  switch (user?.role) {
    case "Admin":
      currentMenu = adminSidebarMenu;
      break;
    case "Center Manager":
      currentMenu = managerSidebarMenu;
      break;
    case "Teacher":
      currentMenu = teacherSidebarMenu;
      break;
    case "Learner":
      currentMenu = learnerSidebarMenu;
      break;
    default:
      // If no valid role exists yet, safe fallback to prevent page execution crashes
      currentMenu = [];
  }

  // Construct a fallback profile moniker display label using available name strings
  const displayName = user 
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
    : "Guest User";

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        {/* === HEADER === */}
        {/* Pass the dynamic, live display name string straight up to your header component */}
        <Header username={displayName}></Header>
      </header>

      {/* === SIDEBAR === */}
      <aside className="dashboard-sidebar">
        <Sidebar MenuItems={currentMenu}></Sidebar>
      </aside>
          
      {/** === MAIN CONTENT == */}
      <main className="dashboard-main">
        {/* This core outlet node dynamically mounts whichever page the user is currently visiting */}
        <Outlet></Outlet>
      </main>
    </div>
  );
}