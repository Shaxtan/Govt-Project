/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================
*/
import LiveTrack from "pages/LiveTrack/LiveTrack";
import Alerts from "../src/pages/Alerts/Alerts";
import LoadCellReport from "../src/pages/LoadCellReport/LoadCellReport";
import DeviceConfiguration from "./pages/Alerts/DeviceConfiguration";

// Material Dashboard 2 React layouts
import Dashboard from "../src/pages/dashboard";
import Dashboard2 from "../src/pages/dashboard2"; 
import Notifications from "../src/pages/notifications";
import SignIn from "../src/pages/authentication/sign-in";
import SignUp from "../src/pages/authentication/sign-up";

// 🔥 Step 1: Import your General Report component
// Adjust the path according to where you saved the file
import GeneralReport from "../src/pages/Reports/GeneralReport"; 

// @mui icons
import Icon from "@mui/material/Icon";
import MapView from "../src/pages/LoadCellReport/MapView";

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  
  // ----------------------------------------------------------------------
  // 🔥 PARENT: REPORTS
  // ----------------------------------------------------------------------
  {
    type: "collapse",
    name: "Reports",
    key: "reports",
    icon: <Icon fontSize="small">assessment</Icon>,
    route: "/reports/general-report", // Default route for the parent
    component: <GeneralReport />, 
  },

  // ----------------------------------------------------------------------
  // 🔥 NEW ROUTE: GENERAL REPORT
  // ----------------------------------------------------------------------
  {
    type: "collapse",
    name: "General Report",
    key: "general-report",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/reports/general-report",
    component: <GeneralReport />,
    parent: "reports", // Connects it to your reports dropdown/section
  },

  // You can uncomment and add other reports back here as needed
  {
    type: "collapse",
    name: "Alerts",
    key: "alerts",
    icon: <Icon fontSize="small">warning</Icon>,
    route: "/alerts",
    component: <Alerts />,
    parent: "reports",
  },
  
  {
    key: "sign-in",
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
];

export default routes;