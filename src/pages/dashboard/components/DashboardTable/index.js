import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";

import MDBox from "../../../../assets/components/MDBox";
import MDTypography from "../../../../assets/components/MDTypography";

import DataTable from "../../../../assets/components/examples/Tables/DataTable";
import { exportCSV, exportExcel, exportPDF } from "./dashUtils";

import { tablePaginationHideSelectSx, clickableTextSx } from "./Projects.styles";

// ================= STYLES =================

const scrollContainerSx = {
  height: "calc(100vh - 160px)",
  overflowY: "auto",
  overflowX: "hidden",
  paddingBottom: "20px",
  position: "relative",
  "&::-webkit-scrollbar": { width: "6px" },
  "&::-webkit-scrollbar-track": { background: "#f1f1f1" },
  "&::-webkit-scrollbar-thumb": { background: "#888", borderRadius: "4px" },
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
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  fontWeight: PropTypes.string,
  isClickable: PropTypes.bool,
  onClick: PropTypes.func,
};

const AddressCell = ({ item }) => (
  <MDBox display="flex" flexDirection="column" alignItems="flex-start" lineHeight={1.4}>
    {item.address && item.address !== "NA" && item.address.trim() !== "" ? (
      <MDTypography variant="caption" color="text">
        {item.address}
      </MDTypography>
    ) : (
      <MDTypography variant="caption" color="textSecondary" fontSize="0.7rem">
        Address Not Available
      </MDTypography>
    )}
  </MDBox>
);

AddressCell.propTypes = { item: PropTypes.object };

// ================= COLUMNS (CHECKBOX REMOVED) =================

const IOT_COLUMNS = [
  { Header: "Device ID / IMEI", accessor: "id", width: "25%", align: "left" },
  { Header: "Account ID", accessor: "accId", width: "20%", align: "left" },
  { Header: "Created Time (CTS)", accessor: "cts", width: "25%", align: "center" },
  { Header: "Address", accessor: "address", width: "30%", align: "left" },
];

// ================= MAIN COMPONENT =================

function Projects({ accountId, reportData = [] }) {
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);

  // -------- DATA FILTERING & MAPPING --------

  const { filteredRows } = useMemo(() => {
    const rows = reportData
      .filter((item) => {
        // 1. Search Filter
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          String(item.id || "")
            .toLowerCase()
            .includes(term) ||
          String(item.accId || "")
            .toLowerCase()
            .includes(term);

        // 2. Date Range Filter
        let matchesDate = true;
        if (item.cts) {
          const itemDate = new Date(item.cts).getTime();
          if (fromDate) {
            const start = new Date(fromDate).setHours(0, 0, 0, 0);
            if (itemDate < start) matchesDate = false;
          }
          if (toDate) {
            const end = new Date(toDate).setHours(23, 59, 59, 999);
            if (itemDate > end) matchesDate = false;
          }
        }

        return matchesSearch && matchesDate;
      })
      .map((item) => ({
        id: <DataCell text={item.id} fontWeight="bold" />,
        accId: <DataCell text={item.accId} />,
        cts: <DataCell text={item.cts ? new Date(item.cts).toLocaleString() : "N/A"} />,
        address: <AddressCell item={{ address: item.address }} />,
      }));

    return { filteredRows: rows };
  }, [reportData, searchTerm, fromDate, toDate]);

  // -------- EXPORT LOGIC --------

  const handleExportData = (format) => {
    closeMenu();
    const dataToExport = reportData.map((item) => ({
      imei: item.id,
      accountId: item.accId,
      timestamp: item.cts,
      address: item.address || "N/A",
    }));

    if (!dataToExport.length) {
      alert("No data available to export.");
      return;
    }

    const filename = `IoT_Report_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") exportCSV(dataToExport, `${filename}.csv`);
    if (format === "excel") exportExcel(dataToExport, `${filename}.xlsx`);
    if (format === "pdf") exportPDF(dataToExport, `${filename}.pdf`);
  };

  return (
    <MDBox>
      <Card sx={{ mb: 2 }}>
        <MDBox p={2} display="flex" flexDirection="column" gap={2}>
          {/* Top Row: Title and Total */}
          <MDBox display="flex" justifyContent="space-between" alignItems="center">
            <MDBox>
              <MDTypography variant="h5" fontWeight="medium">
                IoT Device Dashboard
              </MDTypography>
              <MDTypography variant="button" color="text">
                {filteredRows.length} matches found
              </MDTypography>
            </MDBox>

            <MDBox display="flex" gap={1}>
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

          {/* Bottom Row: Search and Date Selectors */}
          <MDBox display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField
              size="small"
              label="Search IMEI"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: "200px" }}
            />

            <TextField
              label="From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="To"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl variant="outlined" size="small" sx={{ minWidth: 90 }}>
              <Select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                sx={{ height: "40px" }}
              >
                {[10, 20, 50, 100].map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MDBox>
        </MDBox>
      </Card>
      {/* TABLE SECTION */}
      <MDBox sx={scrollContainerSx}>
        <Card sx={stickyCardSx(10)}>
          <MDBox p={3} pb={0}>
            <MDBox display="flex" alignItems="center" gap={1}>
              <Icon color="info" fontSize="large">
                router
              </Icon>
              <MDBox>
                <MDTypography variant="h6" color="info">
                  Non-Functional Devices
                </MDTypography>
                <MDTypography variant="caption" color="text">
                  Connectivity Report
                </MDTypography>
              </MDBox>
            </MDBox>
          </MDBox>

          <MDBox p={3}>
            <DataTable
              table={{ columns: IOT_COLUMNS, rows: filteredRows }}
              isSorted={true}
              entriesPerPage={{ defaultValue: pageSize, entries: [10, 20, 50, 100] }}
              showTotalEntries
              pagination={{ variant: "gradient", color: "info" }}
              noEndBorder
              sx={tablePaginationHideSelectSx}
            />
          </MDBox>
        </Card>
      </MDBox>
    </MDBox>
  );
}

Projects.propTypes = {
  accountId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  reportData: PropTypes.array,
};

export default Projects;
