import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
// ApiService not needed now, but you can keep the import if you want to reuse later
// import ApiService from "../../../../services/ApiService";

import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import MDBox from "../../../../assets/components/MDBox";
import MDTypography from "../../../../assets/components/MDTypography";
import MDButton from "../../../../assets/components/MDButton";

import DataTable from "../../../../assets/components/examples/Tables/DataTable";
import { exportCSV, exportExcel, exportPDF } from "./dashUtils";

import {
  checkboxBaseSx,
  tablePaginationHideSelectSx,
  clickableTextSx,
  addressMapLinkSx,
} from "./Projects.styles";

// ================= SCROLL / STACK STYLES =================

const scrollContainerSx = {
  height: "calc(100vh - 160px)",
  overflowY: "auto",
  overflowX: "hidden",
  paddingBottom: "20px",
  position: "relative",
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "#f1f1f1",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#888",
    borderRadius: "4px",
  },
};

const stickyCardSx = (zIndex) => ({
  position: "sticky",
  top: 0,
  zIndex,
  minHeight: "100%",
  marginBottom: 0,
  boxShadow: "0 -5px 20px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
  borderTop: "1px solid rgba(0,0,0,0.1)",
  transition: "transform 0.3s ease",
});

// ================= SMALL CELL COMPONENTS =================

const DataCell = ({ text, color = "text", fontWeight = "medium", isClickable, onClick }) => {
  if (isClickable) {
    return (
      <MDTypography
        variant="caption"
        color="info"
        fontWeight="bold"
        sx={clickableTextSx}
        onClick={onClick}
      >
        {text}
      </MDTypography>
    );
  }
  return (
    <MDTypography variant="caption" color={color} fontWeight={fontWeight}>
      {text}
    </MDTypography>
  );
};

DataCell.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string,
  fontWeight: PropTypes.string,
  isClickable: PropTypes.bool,
  onClick: PropTypes.func,
};

const Status = ({ status }) => {
  const color = status === "Active" ? "success" : status === "Inactive" ? "error" : "warning";
  return (
    <MDBox lineHeight={1}>
      <MDTypography variant="caption" color={color} fontWeight="bold">
        {status}
      </MDTypography>
    </MDBox>
  );
};

Status.propTypes = { status: PropTypes.string.isRequired };

const Ignition = ({ status }) => {
  const ignitionStatus = status > 0 ? "On" : "Off";
  const color = ignitionStatus === "On" ? "success" : "error";
  return (
    <MDTypography variant="caption" color={color} fontWeight="bold">
      {ignitionStatus}
    </MDTypography>
  );
};

Ignition.propTypes = { status: PropTypes.number.isRequired };

const LockUnlock = ({ isLocked, deviceStatus, elkType }) => {
  let iconName, color, tooltipText;

  if (elkType === "U" || elkType === "L") {
    if (elkType === "L") {
      iconName = "lock";
      color = "success";
      tooltipText = "Device Status: LOCKED (Ready to Unlock)";
    } else {
      iconName = "lock_open";
      color = "error";
      tooltipText = "Device Status: UNLOCKED";
    }
  } else {
    switch (deviceStatus) {
      case "ROPE_CUT":
        iconName = "gpp_bad";
        color = "error";
        tooltipText = "Device Alert: Rope Cut Detected";
        break;
      case "CASE_TAMPER":
        iconName = "lock_person";
        color = "warning";
        tooltipText = "Device Alert: Case Tamper / String Tamper";
        break;
      case "ROPE_INSERT":
        iconName = "lock_reset";
        color = "info";
        tooltipText = "Device Status: Rope Inserted / Pending Lock";
        break;
      default:
        iconName = isLocked ? "lock" : "lock_open";
        color = isLocked ? "error" : "success";
        tooltipText = isLocked
          ? "Trip Status: Locked (Ready to Unlock)"
          : "Trip Status: Unlocked";
        break;
    }
  }

  return (
    <MDBox display="flex" justifyContent="center">
      <Tooltip
        title={
          <MDTypography variant="caption" color="light" fontWeight="bold">
            {tooltipText}
          </MDTypography>
        }
      >
        <IconButton size="small" color={color}>
          <Icon fontSize="medium">{iconName}</Icon>
        </IconButton>
      </Tooltip>
    </MDBox>
  );
};

LockUnlock.propTypes = {
  isLocked: PropTypes.bool.isRequired,
  deviceStatus: PropTypes.string,
  elkType: PropTypes.string,
};

const AddressCell = ({ item }) => (
  <MDBox display="flex" flexDirection="column" alignItems="flex-start" lineHeight={1.4}>
    {item.address && item.address !== "NA" && item.address.trim() !== "" ? (
      <MDTypography variant="caption" color="text">
        {item.address}
      </MDTypography>
    ) : item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng) ? (
      <MDTypography
        variant="caption"
        color="info"
        fontWeight="bold"
        sx={addressMapLinkSx}
        onClick={() =>
          window.open(
            `https://www.google.com/maps?q=${item.lat.toFixed(6)},${item.lng.toFixed(6)}`,
            "_blank",
            "noopener,noreferrer"
          )
        }
      >
        Open in Google Maps ↗
      </MDTypography>
    ) : (
      <MDTypography variant="caption" color="textSecondary" fontSize="0.7rem" mt={0.5}>
        No coordinates available
      </MDTypography>
    )}
  </MDBox>
);

AddressCell.propTypes = { item: PropTypes.object };

// ================= COLUMNS =================

const VTS_COLUMNS = [
  { Header: "No", accessor: "no", width: "5%", align: "left" },
  { Header: "Acc Name", accessor: "accountName", width: "12%", align: "left" },
  { Header: "VEHICLE NO.", accessor: "vehicleNo", width: "10%", align: "left" },
  { Header: "IMEI", accessor: "imei", width: "12%", align: "center" },
  { Header: "SIM NO", accessor: "simNo", width: "12%", align: "center" },
  { Header: "DATE/TIME", accessor: "date", width: "12%", align: "center" },
  { Header: "ADDRESS", accessor: "address", width: "20%", align: "left" },
  { Header: "LATITUDE", accessor: "latitude", width: "10%", align: "center" },
  { Header: "LONGITUDE", accessor: "longitude", width: "10%", align: "center" },
  { Header: "GPS STATUS", accessor: "gpsStatus", width: "8%", align: "center" },
  { Header: "IGNITION", accessor: "ignitionStatus", width: "8%", align: "center" },
  { Header: "LOAD SENSOR", accessor: "avgSpeed", width: "7%", align: "center" },
  { Header: "CURRENT SPEED", accessor: "currentSpeed", width: "8%", align: "center" },
];

const ELK_COLUMNS = [
  { Header: "No", accessor: "no", width: "5%", align: "left" },
  { Header: "Acc Name", accessor: "accountName", width: "12%", align: "left" },
  { Header: "VEHICLE NO.", accessor: "vehicleNo", width: "10%", align: "left" },
  { Header: "IMEI", accessor: "imei", width: "12%", align: "center" },
  { Header: "SIM NO", accessor: "simNo", width: "12%", align: "center" },
  { Header: "DATE/TIME", accessor: "date", width: "12%", align: "center" },
  { Header: "ADDRESS", accessor: "address", width: "20%", align: "left" },
  { Header: "LATITUDE", accessor: "latitude", width: "10%", align: "center" },
  { Header: "LONGITUDE", accessor: "longitude", width: "10%", align: "center" },
  { Header: "GPS STATUS", accessor: "gpsStatus", width: "8%", align: "center" },
  { Header: "CURRENT SPEED", accessor: "currentSpeed", width: "8%", align: "center" },
  { Header: "LOCK STATUS", accessor: "lockUnlock", width: "8%", align: "center" },
  { Header: "UNLOCK", accessor: "checkbox", width: "5%", align: "center" },
];

const UNREACHABLE_COLUMNS = [
  { Header: "No", accessor: "no", width: "5%", align: "left" },
  { Header: "Acc Name", accessor: "accountName", width: "18%", align: "left" },
  { Header: "Acc ID", accessor: "accountId", width: "10%", align: "left" },
  { Header: "VEHICLE NO.", accessor: "vehicleNo", width: "12%", align: "left" },
  { Header: "IMEI", accessor: "imei", width: "15%", align: "center" },
  { Header: "Dev Type", accessor: "deviceType", width: "15%", align: "left" },
  { Header: "Created On", accessor: "createdOn", width: "15%", align: "left" },
];

// ================= MAIN COMPONENT =================

function Projects({ accountId }) {
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // no async loading now
  const [loading] = useState(false);

  // ---------- MOCK DATA (5 ROWS EACH) ----------

  const [allVtsRows] = useState([
    {
      no: <DataCell text={1} fontWeight="bold" />,
      accountName: <DataCell text="ABC Logistics" />,
      vehicleNo: (
        <DataCell
          text="MP04AB1234"
          fontWeight="bold"
          isClickable
          onClick={() =>
            navigate(`/live-track?imei=111111111111111`, {
              state: { targetImei: "111111111111111", targetAccountId: accountId },
            })
          }
        />
      ),
      imei: <DataCell text="111111111111111" />,
      simNo: <DataCell text="9876543210" />,
      date: <DataCell text="2025-12-29 10:00:00" />,
      address: <AddressCell item={{ address: "Bhopal, MP, India" }} />,
      latitude: <DataCell text="23.259933°" />,
      longitude: <DataCell text="77.412613°" />,
      gpsStatus: <Status status="Active" />,
      ignitionStatus: <Ignition status={1} />,
      avgSpeed: <DataCell text={45} />,
      currentSpeed: <DataCell text="50 km/h" color="success" fontWeight="bold" />,
      checkbox: null,
      _imei: "111111111111111",
      _isLockedInitial: false,
    },
    {
      no: <DataCell text={2} fontWeight="bold" />,
      accountName: <DataCell text="XYZ Transport" />,
      vehicleNo: <DataCell text="MP04CD5678" fontWeight="bold" />,
      imei: <DataCell text="222222222222222" />,
      simNo: <DataCell text="9876500000" />,
      date: <DataCell text="2025-12-29 09:45:00" />,
      address: <AddressCell item={{ address: "Indore, MP, India" }} />,
      latitude: <DataCell text="22.719568°" />,
      longitude: <DataCell text="75.857727°" />,
      gpsStatus: <Status status="Inactive" />,
      ignitionStatus: <Ignition status={0} />,
      avgSpeed: <DataCell text="N/A" />,
      currentSpeed: <DataCell text="0 km/h" fontWeight="bold" />,
      checkbox: null,
      _imei: "222222222222222",
      _isLockedInitial: false,
    },
    {
      no: <DataCell text={3} fontWeight="bold" />,
      accountName: <DataCell text="Test Account 1" />,
      vehicleNo: <DataCell text="MP04EF9999" fontWeight="bold" />,
      imei: <DataCell text="333333333333333" />,
      simNo: <DataCell text="9000000001" />,
      date: <DataCell text="2025-12-28 18:30:00" />,
      address: <AddressCell item={{ address: "Jabalpur, MP, India" }} />,
      latitude: <DataCell text="23.181467°" />,
      longitude: <DataCell text="79.986407°" />,
      gpsStatus: <Status status="Active" />,
      ignitionStatus: <Ignition status={0} />,
      avgSpeed: <DataCell text={30} />,
      currentSpeed: <DataCell text="0 km/h" fontWeight="bold" />,
      checkbox: null,
      _imei: "333333333333333",
      _isLockedInitial: true,
    },
    {
      no: <DataCell text={4} fontWeight="bold" />,
      accountName: <DataCell text="Test Account 2" />,
      vehicleNo: <DataCell text="MP04GH7777" fontWeight="bold" />,
      imei: <DataCell text="444444444444444" />,
      simNo: <DataCell text="9000000002" />,
      date: <DataCell text="2025-12-29 06:10:00" />,
      address: <AddressCell item={{ address: "Gwalior, MP, India" }} />,
      latitude: <DataCell text="26.218287°" />,
      longitude: <DataCell text="78.182831°" />,
      gpsStatus: <Status status="Active" />,
      ignitionStatus: <Ignition status={1} />,
      avgSpeed: <DataCell text={52} />,
      currentSpeed: <DataCell text="60 km/h" color="success" fontWeight="bold" />,
      checkbox: null,
      _imei: "444444444444444",
      _isLockedInitial: false,
    },
    {
      no: <DataCell text={5} fontWeight="bold" />,
      accountName: <DataCell text="Demo Account" />,
      vehicleNo: <DataCell text="MP04JK5555" fontWeight="bold" />,
      imei: <DataCell text="555555555555555" />,
      simNo: <DataCell text="9000000003" />,
      date: <DataCell text="2025-12-27 14:20:00" />,
      address: <AddressCell item={{ address: "Satna, MP, India" }} />,
      latitude: <DataCell text="24.577255°" />,
      longitude: <DataCell text="80.833403°" />,
      gpsStatus: <Status status="Inactive" />,
      ignitionStatus: <Ignition status={0} />,
      avgSpeed: <DataCell text="N/A" />,
      currentSpeed: <DataCell text="0 km/h" fontWeight="bold" />,
      checkbox: null,
      _imei: "555555555555555",
      _isLockedInitial: true,
    },
  ]);

  const [allElkRows] = useState([
    {
      no: <DataCell text={1} fontWeight="bold" />,
      accountName: <DataCell text="ABC Logistics" />,
      vehicleNo: <DataCell text="MP04AB1234" fontWeight="bold" />,
      imei: <DataCell text="666666666666666" />,
      simNo: <DataCell text="9999990001" />,
      date: <DataCell text="2025-12-29 10:05:00" />,
      address: <AddressCell item={{ address: "Bhopal Warehouse" }} />,
      latitude: <DataCell text="23.259933°" />,
      longitude: <DataCell text="77.412613°" />,
      gpsStatus: <Status status="Active" />,
      currentSpeed: <DataCell text="0 km/h" fontWeight="bold" />,
      lockUnlock: <LockUnlock isLocked={true} elkType="L" deviceStatus={null} />,
      checkbox: null,
      _imei: "666666666666666",
      _isLockedInitial: true,
    },
    {
      no: <DataCell text={2} fontWeight="bold" />,
      accountName: <DataCell text="XYZ Transport" />,
      vehicleNo: <DataCell text="MP04CD5678" fontWeight="bold" />,
      imei: <DataCell text="777777777777777" />,
      simNo: <DataCell text="9999990002" />,
      date: <DataCell text="2025-12-29 09:00:00" />,
      address: <AddressCell item={{ address: "Indore Yard" }} />,
      latitude: <DataCell text="22.719568°" />,
      longitude: <DataCell text="75.857727°" />,
      gpsStatus: <Status status="Inactive" />,
      currentSpeed: <DataCell text="10 km/h" color="success" fontWeight="bold" />,
      lockUnlock: <LockUnlock isLocked={false} elkType="U" deviceStatus={null} />,
      checkbox: null,
      _imei: "777777777777777",
      _isLockedInitial: false,
    },
    {
      no: <DataCell text={3} fontWeight="bold" />,
      accountName: <DataCell text="Test Account 1" />,
      vehicleNo: <DataCell text="MP04EF9999" fontWeight="bold" />,
      imei: <DataCell text="888888888888888" />,
      simNo: <DataCell text="9999990003" />,
      date: <DataCell text="2025-12-28 19:15:00" />,
      address: <AddressCell item={{ address: "Jabalpur Yard" }} />,
      latitude: <DataCell text="23.181467°" />,
      longitude: <DataCell text="79.986407°" />,
      gpsStatus: <Status status="Active" />,
      currentSpeed: <DataCell text="0 km/h" fontWeight="bold" />,
      lockUnlock: <LockUnlock isLocked={false} elkType="N" deviceStatus="ROPE_CUT" />,
      checkbox: null,
      _imei: "888888888888888",
      _isLockedInitial: false,
    },
    {
      no: <DataCell text={4} fontWeight="bold" />,
      accountName: <DataCell text="Test Account 2" />,
      vehicleNo: <DataCell text="MP04GH7777" fontWeight="bold" />,
      imei: <DataCell text="999999999999999" />,
      simNo: <DataCell text="9999990004" />,
      date: <DataCell text="2025-12-29 07:45:00" />,
      address: <AddressCell item={{ address: "Gwalior Yard" }} />,
      latitude: <DataCell text="26.218287°" />,
      longitude: <DataCell text="78.182831°" />,
      gpsStatus: <Status status="Active" />,
      currentSpeed: <DataCell text="5 km/h" color="success" fontWeight="bold" />,
      lockUnlock: <LockUnlock isLocked={true} elkType="L" deviceStatus={null} />,
      checkbox: null,
      _imei: "999999999999999",
      _isLockedInitial: true,
    },
    {
      no: <DataCell text={5} fontWeight="bold" />,
      accountName: <DataCell text="Demo Account" />,
      vehicleNo: <DataCell text="MP04JK5555" fontWeight="bold" />,
      imei: <DataCell text="101010101010101" />,
      simNo: <DataCell text="9999990005" />,
      date: <DataCell text="2025-12-27 15:00:00" />,
      address: <AddressCell item={{ address: "Satna Yard" }} />,
      latitude: <DataCell text="24.577255°" />,
      longitude: <DataCell text="80.833403°" />,
      gpsStatus: <Status status="Inactive" />,
      currentSpeed: <DataCell text="0 km/h" fontWeight="bold" />,
      lockUnlock: <LockUnlock isLocked={false} elkType="N" deviceStatus="CASE_TAMPER" />,
      checkbox: null,
      _imei: "101010101010101",
      _isLockedInitial: false,
    },
  ]);

  const [unreachableRows] = useState([
    {
      no: <DataCell text={1} fontWeight="bold" />,
      accountName: <DataCell text="ABC Logistics" />,
      accountId: <DataCell text="1001" />,
      vehicleNo: <DataCell text="MP04AB1234" fontWeight="bold" />,
      imei: <DataCell text="121212121212121" />,
      deviceType: <DataCell text="VTS" />,
      createdOn: <DataCell text="2025-12-20 11:00:00" />,
    },
    {
      no: <DataCell text={2} fontWeight="bold" />,
      accountName: <DataCell text="XYZ Transport" />,
      accountId: <DataCell text="1002" />,
      vehicleNo: <DataCell text="MP04CD5678" fontWeight="bold" />,
      imei: <DataCell text="131313131313131" />,
      deviceType: <DataCell text="ELK" />,
      createdOn: <DataCell text="2025-12-21 12:30:00" />,
    },
    {
      no: <DataCell text={3} fontWeight="bold" />,
      accountName: <DataCell text="Test Account 1" />,
      accountId: <DataCell text="1003" />,
      vehicleNo: <DataCell text="MP04EF9999" fontWeight="bold" />,
      imei: <DataCell text="141414141414141" />,
      deviceType: <DataCell text="VTS" />,
      createdOn: <DataCell text="2025-12-22 09:15:00" />,
    },
    {
      no: <DataCell text={4} fontWeight="bold" />,
      accountName: <DataCell text="Test Account 2" />,
      accountId: <DataCell text="1004" />,
      vehicleNo: <DataCell text="MP04GH7777" fontWeight="bold" />,
      imei: <DataCell text="151515151515151" />,
      deviceType: <DataCell text="ELK" />,
      createdOn: <DataCell text="2025-12-23 16:45:00" />,
    },
    {
      no: <DataCell text={5} fontWeight="bold" />,
      accountName: <DataCell text="Demo Account" />,
      accountId: <DataCell text="1005" />,
      vehicleNo: <DataCell text="MP04JK5555" fontWeight="bold" />,
      imei: <DataCell text="161616161616161" />,
      deviceType: <DataCell text="VTS" />,
      createdOn: <DataCell text="2025-12-24 18:00:00" />,
    },
  ]);

  const [selectedRows, setSelectedRows] = useState({});
  const [pageSize, setPageSize] = useState(10);

  const [unlockDialog, setUnlockDialog] = useState({
    open: false,
    imei: null,
    vehicleNo: "",
    isBulk: false,
    bulkCount: 0,
    bulkImeis: [],
    bulkLockedCount: 0,
    action: "unlock",
  });

  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);

  const handleToggleSelect = useCallback((imei) => {
    setSelectedRows((prev) => ({ ...prev, [imei]: !prev[imei] }));
  }, []);

  const handleImeiClick = useCallback(
    (imei, accId) => {
      if (!imei || imei === "N/A") return;
      const targetAccountId = accId || accountId;
      navigate(`/live-track?imei=${imei}`, {
        state: { targetImei: imei, targetAccountId },
      });
    },
    [navigate, accountId]
  );

  // -------- FILTERING --------

  const { filteredVts, filteredElk, filteredUnreachable } = useMemo(() => {
    const matchesSearch = (row) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const fields = [
        row.accountName?.props?.text,
        row.vehicleNo?.props?.text,
        row._imei,
        row.address?.props?.item?.address,
      ].filter(Boolean);
      return fields.some((f) => String(f).toLowerCase().includes(term));
    };

    const vts = allVtsRows.filter(matchesSearch).map((row) => ({
      ...row,
      checkbox: (
        <MDBox display="flex" justifyContent="center">
          <Checkbox
            checked={!!selectedRows[row._imei]}
            onChange={() => handleToggleSelect(row._imei)}
            color="primary"
            sx={checkboxBaseSx}
          />
        </MDBox>
      ),
    }));

    const elk = allElkRows.filter(matchesSearch).map((row) => ({
      ...row,
      checkbox: (
        <MDBox display="flex" justifyContent="center">
          <Checkbox
            checked={!!selectedRows[row._imei]}
            onChange={() => handleToggleSelect(row._imei)}
            color="primary"
            sx={checkboxBaseSx}
          />
        </MDBox>
      ),
    }));

    const unreachable = unreachableRows.filter((row) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const fields = [
        row.accountName?.props?.text,
        row.vehicleNo?.props?.text,
        row.imei?.props?.text,
      ].filter(Boolean);
      return fields.some((f) => String(f).toLowerCase().includes(term));
    });

    return { filteredVts: vts, filteredElk: elk, filteredUnreachable: unreachable };
  }, [allVtsRows, allElkRows, unreachableRows, searchTerm, selectedRows, handleToggleSelect]);

  // -------- BULK UNLOCK / LOCK (only UI now) --------

  const handleBulkUnlockClick = () => {
    closeMenu();
    const imeisSelected = Object.keys(selectedRows).filter((imei) => selectedRows[imei]);
    if (imeisSelected.length === 0) {
      // eslint-disable-next-line no-alert
      alert("No devices selected.");
      return;
    }

    const lockedImeisSet = new Set(
      allElkRows.filter((row) => row._isLockedInitial).map((row) => row._imei)
    );
    const selectedLockedCount = imeisSelected.filter((i) => lockedImeisSet.has(i)).length;
    const action = selectedLockedCount > 0 ? "unlock" : "lock";

    setUnlockDialog({
      open: true,
      imei: null,
      vehicleNo: "",
      isBulk: true,
      bulkCount: imeisSelected.length,
      bulkImeis: imeisSelected,
      bulkLockedCount: selectedLockedCount,
      action,
    });
  };

  const handleConfirmUnlock = () => {
    const { imei, isBulk, bulkImeis, action } = unlockDialog;
    setUnlockDialog((p) => ({ ...p, open: false }));

    const imeisToSend = isBulk ? bulkImeis : imei ? [imei] : [];
    if (!imeisToSend.length) return;

    const command = action === "lock" ? "LOCK" : "UNLOCK";

    // API call removed for mock version:
    // imeisToSend.forEach((targetImei) => {
    //   ApiService.sendCommand({ imei: targetImei, command }, () => {});
    // });

    // eslint-disable-next-line no-alert
    alert(`${command} command initiated for ${imeisToSend.length} device(s).`);

    if (isBulk) setSelectedRows({});
  };

  const handleExportData = (format) => {
    closeMenu();

    const allRows = [...filteredVts, ...filteredElk, ...filteredUnreachable];

    const dataToExport = allRows.map((row) => ({
      accountName: row.accountName?.props?.text || "",
      vehnum: row.vehicleNo?.props?.text || "",
      imei: row._imei || row.imei?.props?.text || "",
      simNo: row.simNo?.props?.text || "",
      devTs: row.date?.props?.text || "",
      address: row.address?.props?.item?.address || "N/A",
      lat: row.latitude?.props?.text || "",
      lng: row.longitude?.props?.text || "",
    }));

    if (!dataToExport.length) {
      // eslint-disable-next-line no-alert
      alert("No data available to export.");
      return;
    }

    const filename = `Dashboard_Report_${new Date().toISOString().split("T")[0]}`;

    switch (format) {
      case "csv":
        exportCSV(dataToExport, `${filename}.csv`);
        break;
      case "excel":
        exportExcel(dataToExport, `${filename}.xlsx`);
        break;
      case "pdf":
        exportPDF(dataToExport, `${filename}.pdf`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    // in mock mode loading is always false, so this will not render
    return (
      <Card>
        <MDBox
          p={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Icon color="info">hourglass_empty</Icon>
          <MDTypography variant="h6" ml={2}>
            Loading Dashboard...
          </MDTypography>
        </MDBox>
      </Card>
    );
  }

  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const dialogTitle =
    unlockDialog.action === "lock" ? "Confirm Lock?" : "Confirm Unlock?";

  const dialogContent = unlockDialog.isBulk ? (
    <>
      Are you sure you want to <strong>{unlockDialog.action}</strong>{" "}
      <strong>{unlockDialog.bulkCount}</strong> selected devices?
    </>
  ) : (
    <>
      Are you sure you want to <strong>{unlockDialog.action}</strong> device{" "}
      <strong>{unlockDialog.vehicleNo}</strong> (IMEI: {unlockDialog.imei})?
    </>
  );

  return (
    <MDBox>
      {/* FIXED HEADER */}
      <Card sx={{ mb: 2 }}>
        <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
          <MDBox>
            <MDTypography variant="h5" fontWeight="medium">
              Trip Dashboard
            </MDTypography>
            <MDTypography variant="button" color="text">
              {filteredVts.length + filteredElk.length + filteredUnreachable.length} total rows
            </MDTypography>
          </MDBox>

          <MDBox display="flex" gap={2} alignItems="center">
            {selectedCount > 0 && (
              <MDButton
                size="small"
                variant="gradient"
                color="error"
                onClick={handleBulkUnlockClick}
              >
                Unlock / Lock Selected ({selectedCount})
              </MDButton>
            )}

            <TextField
              size="small"
              variant="outlined"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon>search</Icon>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl variant="outlined" size="small" sx={{ minWidth: 90 }}>
              <Select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                displayEmpty
                sx={{ height: "40px" }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={openMenu}>
              <Icon>more_vert</Icon>
            </IconButton>
            <Menu anchorEl={menu} open={Boolean(menu)} onClose={closeMenu}>
              <MenuItem onClick={() => handleExportData("csv")}>Export CSV</MenuItem>
              <MenuItem onClick={() => handleExportData("excel")}>Export Excel</MenuItem>
              <MenuItem onClick={() => handleExportData("pdf")}>Export PDF</MenuItem>
            </Menu>
          </MDBox>
        </MDBox>
      </Card>

      {/* SCROLLING AREA WITH STACKED STICKY CARDS */}
      <MDBox sx={scrollContainerSx}>
        {/* CARD 1: VTS */}
        <Card sx={stickyCardSx(10)}>
          <MDBox p={3} pb={0}>
            <MDBox display="flex" alignItems="center" justifyContent="space-between">
              <MDBox display="flex" alignItems="center" gap={1}>
                <Icon color="info" fontSize="large">
                  local_shipping
                </Icon>
                <MDBox>
                  <MDTypography variant="h6" color="info">
                    VTS Vehicles
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Live Trip Report
                  </MDTypography>
                </MDBox>
              </MDBox>
              <MDTypography variant="button" fontWeight="bold">
                {filteredVts.length} rows
              </MDTypography>
            </MDBox>
          </MDBox>

          <MDBox p={3}>
            <DataTable
              table={{ columns: VTS_COLUMNS, rows: filteredVts }}
              isSorted={false}
              entriesPerPage={{ defaultValue: pageSize, entries: [pageSize] }}
              showTotalEntries
              pagination={{ variant: "gradient", color: "info" }}
              noEndBorder
              sx={tablePaginationHideSelectSx}
            />
          </MDBox>
        </Card>

        {/* CARD 2: PADLOCK / ELK */}
        <Card sx={stickyCardSx(20)}>
          <MDBox p={3} pb={0}>
            <MDBox display="flex" alignItems="center" justifyContent="space-between">
              <MDBox display="flex" alignItems="center" gap={1}>
                <Icon color="warning" fontSize="large">
                  lock
                </Icon>
                <MDBox>
                  <MDTypography variant="h6" color="warning">
                    Padlock Devices
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Lock status overview
                  </MDTypography>
                </MDBox>
              </MDBox>
              <MDTypography variant="button" fontWeight="bold">
                {filteredElk.length} rows
              </MDTypography>
            </MDBox>
          </MDBox>

          <MDBox p={3}>
            <DataTable
              table={{ columns: ELK_COLUMNS, rows: filteredElk }}
              isSorted={false}
              entriesPerPage={{ defaultValue: pageSize, entries: [pageSize] }}
              showTotalEntries
              pagination={{ variant: "gradient", color: "warning" }}
              noEndBorder
              sx={tablePaginationHideSelectSx}
            />
          </MDBox>
        </Card>

        {/* CARD 3: UNREACHABLE */}
        <Card sx={stickyCardSx(30)}>
          <MDBox p={3} pb={0}>
            <MDBox display="flex" alignItems="center" justifyContent="space-between">
              <MDBox display="flex" alignItems="center" gap={1}>
                <Icon color="error" fontSize="large">
                  signal_wifi_off
                </Icon>
                <MDBox>
                  <MDTypography variant="h6" color="error">
                    Unreachable Devices
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Offline / no data
                  </MDTypography>
                </MDBox>
              </MDBox>
              <MDTypography variant="button" fontWeight="bold">
                {filteredUnreachable.length} rows
              </MDTypography>
            </MDBox>
          </MDBox>

          <MDBox p={3}>
            <DataTable
              table={{ columns: UNREACHABLE_COLUMNS, rows: filteredUnreachable }}
              isSorted={false}
              entriesPerPage={{ defaultValue: pageSize, entries: [pageSize] }}
              showTotalEntries
              pagination={{ variant: "gradient", color: "error" }}
              noEndBorder
              sx={tablePaginationHideSelectSx}
            />
          </MDBox>
        </Card>
      </MDBox>

      {/* UNLOCK DIALOG */}
      <Dialog
        open={unlockDialog.open}
        onClose={() => setUnlockDialog((p) => ({ ...p, open: false }))}
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogContent}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <MDButton
            onClick={() => setUnlockDialog((p) => ({ ...p, open: false }))}
            color="dark"
          >
            Cancel
          </MDButton>
          <MDButton onClick={handleConfirmUnlock} color="info" autoFocus>
            Confirm
          </MDButton>
        </DialogActions>
      </Dialog>
    </MDBox>
  );
}

Projects.propTypes = {
  accountId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default Projects;
