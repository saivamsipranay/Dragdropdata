import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
// import Box from '@mui/material/Box';
// import Drawer from '@mui/material/Drawer';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
// import CardActions from '@mui/material/CardActions';
// import "./App.css";
// import { colors } from "@mui/material";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { faArrowLeft, faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from "axios";

import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dragdropdata.css";

const Dragdropdata = () => {
  const { customEntitySpecId,myEmpId ,entityId} = useParams();
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [summary, setSummary] = useState({
    totalCustomEntities: "0",
    totalAmount: "0",
  });
  const [filter, setFilter] = useState("listItems");
  const scrollContainerRef = useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [entities, setEntities] = useState([]); // Store available field labels as buttons
  const [firstFieldLabel, setFirstFieldLabel] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState(-1);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [entitiesData, setEntitiesData] = useState([]);
  const [initialEntityId, setInitialEntityId] = useState(null);
  const [hasEmployeeData, setHasEmployeeData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStateData, setHasStateData] = useState(false);
  const [loading, setLoading] = useState(false);

  

  const booleanCondition = true; 
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft + clientWidth < scrollWidth);
    }
  };

  useLayoutEffect(() => {
    updateScrollButtons();
  });

  useEffect(() => {
    const saveScrollPosition = () => {
      if (scrollContainerRef.current) {
        localStorage.setItem(
          "scrollPosition",
          scrollContainerRef.current.scrollLeft
        );
      }
    };

    const updateOnResize = () => {
      updateScrollButtons();
    };

    window.addEventListener("beforeunload", saveScrollPosition);
    window.addEventListener("resize", updateOnResize);

    return () => {
      window.removeEventListener("beforeunload", saveScrollPosition);
      window.removeEventListener("resize", updateOnResize);
    };
  }, []);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -380,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 500);
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: +380,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 500);
    }
  };
 
const fetchData = async () => {
  setLoading(true);
  try {
    let entityIdValue = entityId;
    let fetchedEntities = [];

    try {
      const initialResponse = await axios.get(
        `https://staging.spoors.in/effortx/extraService/custom/entity/all/list/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}`
      );
      console.log("API Response:", initialResponse.data);

      fetchedEntities = initialResponse.data.entities; // Assign API response
      setEntities(fetchedEntities); // Store in state

      if (!fetchedEntities || fetchedEntities.length === 0) {
        console.error("No entities found");
        return;
      }


      if (selectedEntityId === -1 || selectedEntityId === null) {
        entityIdValue = fetchedEntities[0]?.entityId || null;
        const initialFilter = fetchedEntities[0]?.["field label"];
      if (initialFilter) {
        setFilter(initialFilter);
        console.log("Initial filter set to:", initialFilter);
      }
        setSelectedEntityId(entityIdValue); 
        console.log("Updated selectedEntityId to:", entityIdValue);
      } else {
        entityIdValue = selectedEntityId;
      }

      setFirstFieldLabel(fetchedEntities[0]["field label"]);
    } catch (error) {
      console.error("Error fetching entity list:", error);
      return;
    }

    if (entityIdValue === -1 || entityIdValue === null) {
      console.warn("Invalid entityId, setting to first available entity.");
      if (fetchedEntities.length > 0) {
        entityIdValue = fetchedEntities[0]?.entityId || null;
        setSelectedEntityId(entityIdValue);
      } else {
        console.error("No available entities to set entityId.");
        return;
      }
    }
    let url = "";
    if (filter === "employees") {
      url = `https://staging.spoors.in/effortx/extraService/custom/entity/employee/mapping/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}`;
    } else if (filter === "state") {
      url = `https://staging.spoors.in/effortx/extraService/custom/entity/state/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}`;
    } else {
      url = `https://staging.spoors.in/effortx/extraService/custom/entity/list/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}&entityId=${entityIdValue}`;
    }

    console.log("Fetching data from:", url);
    const response = await axios.get(url);
    const data = response.data;

    if (data.summary) {
      setSummary(data.summary);
    }

    
  
    let processedDeals = [];
    if (Array.isArray(data.deals) && data.deals.length > 0) {
      processedDeals = data.deals.map((deal) => {
        const key = Object.keys(deal)[0];
        const customEntityItems =
          deal[key]?.custom_entity_items?.map((item) => ({
            ...item,
            formId: item.formId,
          })) || [];

        return {
          [key]: {
            ...deal[key],
            custom_entity_items: customEntityItems,
          },
        };
      });
    } else {
      console.warn("No deals found for this entity.");
    }

    setDeals(processedDeals);
    setFilteredDeals(processedDeals.length > 0 ? processedDeals : deals); 

    
    try {
      console.log("Fetching employee data...");
      const employeeResponse = await axios.get(
        `https://staging.spoors.in/effortx/extraService/custom/entity/employee/mapping/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}`
      );

      console.log("Employee API Response:", employeeResponse.data);

      if (employeeResponse.data.deals && Array.isArray(employeeResponse.data.deals) && employeeResponse.data.deals.length > 0) {
        console.log("✅ Employees exist. Showing button.");
        setHasEmployeeData(true);
      } else {
        console.log("❌ No employees found. Hiding button.");
        setHasEmployeeData(false);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setHasEmployeeData(false);
    }

  } catch (error) {
    console.error("There was an error fetching the data!", error);
  }

  try {
    console.log("Fetching state data...");
    const stateResponse = await axios.get(
      `https://staging.spoors.in/effortx/extraService/custom/entity/state/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}`
    );
  
    console.log("State API Response:", stateResponse.data);
  
    if (stateResponse.data.deals && Array.isArray(stateResponse.data.deals) && stateResponse.data.deals.length > 0) {
      console.log("✅ State data exists. Showing button.");
      setHasStateData(true);
    } else {
      console.log("❌ No state data found. Hiding button.");
      setHasStateData(false);
    }
  } catch (error) {
    console.error("Error fetching state data:", error);
    setHasStateData(false);
  }
  setLoading(false);
};


useEffect(() => {
  if (selectedEntityId === "-1" && entities.length > 0) {
    console.log("Updating selectedEntityId in useEffect");
    setSelectedEntityId(entities[0]?.entityId || null);
  }
}, [selectedEntityId, entities]);


  useEffect(() => {
    fetchData();
    setFilteredDeals(deals);
  }, [filter, customEntitySpecId,hasEmployeeData,]);


  
  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchTerm(searchTerm);
  
    const filteredDeals = deals
      .map((listItem) => {
        const listItemKey = Object.keys(listItem)[0];
        const dealCategory = listItem[listItemKey];
  
        
        const filteredItems = dealCategory.custom_entity_items.filter((deal) => {
          return Object.values(deal).some((value) => {
            return (
              value &&
              typeof value === 'string' &&
              value.toLowerCase().includes(searchTerm)
            );
          });
        });
  
      
        return filteredItems.length > 0
          ? {
              [listItemKey]: {
                ...dealCategory,
                custom_entity_items: filteredItems,
              },
            }
          : null;
      })
      .filter((item) => item !== null);
  
    setFilteredDeals(filteredDeals);
    console.log("Filtered Deals:", filteredDeals);
  };
  

  const fetchWithTimeout = (url, options = {}, timeout = 15000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Request timed out"));
      }, timeout);
  
      fetch(url, options)
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };
  

  const onDragEnd = async (result) => {
    const { source, destination } = result;
  
    if (filter === "employees" || filter === "state") {
      alert(`Drag and drop is disabled for ${filter} data.`);
      console.log(`Drag and drop is disabled for ${filter}`);
      return;
    }
  
    if (!destination) {
      console.log("Dropped outside the list");
      return;
    }
  
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log("Item dropped in the same position");
      return;
    }
  
    if (!Array.isArray(deals) || deals.length === 0) {
      console.error("Deals array is not defined or empty");
      return;
    }
  
    const sourceListIndex = Number(source.droppableId);
    const destinationListIndex = Number(destination.droppableId);
  
    if (isNaN(sourceListIndex) || isNaN(destinationListIndex)) {
      console.error("Invalid droppable IDs");
      return;
    }
  
    const sourceDeal = deals[sourceListIndex];
    const destinationDeal = deals[destinationListIndex];
  
    if (!sourceDeal || !destinationDeal) {
      console.error("Source or destination deal is not defined");
      return;
    }
  
    const sourceDealKey = Object.keys(sourceDeal)[0];
    const destinationDealKey = Object.keys(destinationDeal)[0];
  
    if (!sourceDealKey || !destinationDealKey) {
      console.error("Deal keys are not defined");
      return;
    }
  
    const sourceList = [...sourceDeal[sourceDealKey].custom_entity_items];
    const destinationList = [...destinationDeal[destinationDealKey].custom_entity_items];
  
    if (sourceList.length === 1 && destinationList.length === 1) {
      console.log("Only one list available, cannot move");
      return;
    }
  
    const [movedItem] = sourceList.splice(source.index, 1);
  
    if (!movedItem || !movedItem.custom_entity_id) {
      console.error("Invalid moved item:", movedItem);
      return;
    }
  
    // Ensure the item is not already in the destination list to prevent duplicates
    const itemExists = destinationList.some((item) => item.custom_entity_id === movedItem.custom_entity_id);
    if (itemExists) {
      console.error("Item already exists in destination, preventing duplication.");
      return;
    }
  
    destinationList.splice(destination.index, 0, movedItem);
  
    const updatedDeals = deals.map((deal, index) => {
      const dealKey = Object.keys(deal)[0];
      if (index === sourceListIndex) {
        return {
          ...deal,
          [dealKey]: { ...deal[dealKey], custom_entity_items: sourceList },
        };
      }
      if (index === destinationListIndex) {
        return {
          ...deal,
          [dealKey]: { ...deal[dealKey], custom_entity_items: destinationList },
        };
      }
      return deal;
    });
  
    setDeals(updatedDeals);
    setFilteredDeals(updatedDeals);
  
    const updatedItem = {
      ...movedItem,
      id: destinationDeal[destinationDealKey].id,
    };
  
    const requestBody = {
      custom_entity_id: updatedItem.custom_entity_id ?? "",
      entityId: updatedItem.entityId ?? "",
      id: updatedItem.id ?? "",
    };
  
    console.log(`Updating item: ${updatedItem.custom_entity_id} -> ${updatedItem.entityId}`);
    console.log("Request Body:", JSON.stringify(requestBody));
  
    try {
      const response = await fetchWithTimeout(
        `https://staging.spoors.in/effortx/extraService/get/custom/entity/list/mapping?customEntitySpecId=${customEntitySpecId}&entityId=${selectedEntityId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );
  
      console.log("Response Status:", response.status);
  
      if (response.ok) {
        const responseData = await response.json();
        console.log("Deal updated successfully:", responseData);
  
        const itemDetails = Object.entries(movedItem)
          .filter(
            ([key]) =>
              key !== "custom_entity_id" &&
              key !== "formId" &&
              key !== "Status" &&
              key !== "amount"
          )
          .slice(0, 2)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
  
        toast.success(
          `Item moved from ${sourceDealKey} to ${destinationDealKey} with details: ${itemDetails}`,
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        );
  
        fetchData();
      } else {
        const errorText = await response.text();
        console.error(`Error ${response.status}: ${errorText}`);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Error:", error.message);
      if (error.response) {
        console.error("Response Headers:", error.response.headers);
        console.error("Response Config:", error.response.config);
      }
    }
  };
  
  const handleCardClick = (deal) => {
    console.log("handleCardClick called with:", deal);

    const formId = deal.formId ? deal.formId.toString() : "";
    const entityId = deal.custom_entity_id;

    const parentDeal = deals.find((d) =>
      Object.values(d)[0].custom_entity_items.some(
        (item) => item.custom_entity_id === entityId
      )
    );
    const customEntitySpecId = parentDeal
      ? Object.values(parentDeal)[0].custom_entity_specid
      : "";

    if (!formId || !customEntitySpecId) {
      console.error("formId or customEntitySpecId is missing");
      return;
    }

    const baseUrl = `https://secure.spoors.in/effortx/web/form/data/view/`;
    const dynamicUrl = `${baseUrl}${formId}?customEntitySpecId=${customEntitySpecId}`;

    console.log("dynamicUrl:", dynamicUrl);

    window.open(dynamicUrl, "_blank");
  };

  const calculateTotalAmount = (items) => {
    return items.reduce((total, item) => {
      const amount = parseFloat(item.amount) || 0;
      return total + amount;
    }, 0);
  };
  useEffect(() => {
    if (entities.length > 0 && !filter) {
      const initialEntity = entities.find(e => e.entityId === selectedEntityId) || entities[0];
      if (initialEntity) {
        setFilter(initialEntity["field label"]);
        setSelectedEntityId(initialEntity.entityId);
        console.log("Initial filter setup:", initialEntity["field label"]);
      }
    }
  }, [entities, selectedEntityId]); 
  const handleFilterChange = (filterBy, entityId) => {
    console.log("Filter changed to:", filterBy, "Entity ID:", entityId);
    setFilter(filterBy);
    setSelectedEntityId(entityId);
  };
  
  const getDynamicDate = (deal) => {
    for (const [key, value] of Object.entries(deal)) {
      if (value && !isNaN(Date.parse(value))) {
        try {
          const parsedDate = new Date(value);
          
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0'); 
          const day = String(parsedDate.getDate()).padStart(2, '0');
  
          return `${year}-${month}-${day}`;
        } catch {
          continue; 
        }
      }
    }
    return " "; 
  };

  useEffect(() => {
   setTimeout(() => {
      setLoading(false);
    }, 2000); 
  }, []);
  return (
    <div className="container-fluid mt-4-top" style={{ fontSize: '13px' }}>
   {loading && (
  <div className="loading-overlay">
    <div className="text-center">
      <FontAwesomeIcon 
        icon={faSpinner} 
        spin 
        style={{ fontSize: '2rem', color: '#1061cd' }} 
      />
      <p className="mt-2">Loading data...</p>
    </div>
  </div>
)}
      <ToastContainer />
      <div className="height-fixed-top">
        <nav
          style={{ paddingTop: "5px" }}
          className="navbar navbar-light bg-light"
        >
          <form className="form-inline ml-auto">
            <div className="input-group mr-3">
              <input
                style={{ fontSize: "13px" }}
                className="form-control"
                type="search"
                placeholder="Search by entity name"
                aria-label="Search"
                aria-describedby="inputGroup-sizing-default"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </form>

          <div className="nav-data" style={{ paddingRight: "25px" }}>
            <div
              className="nav-total-data"
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "13px",
              }}
            >
              <span>Total Entities: {summary.totalCustomEntities} </span>
              <span style={{ marginLeft: "10px" }}>
                Total Amount: ₹{summary.totalAmount}
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <div className="btn-group" style={{ height: "36px" }}>
  {/* Static buttons */}
  {myEmpId && hasEmployeeData && (
  <button
    className="btn"
    style={{
      backgroundColor: filter === "employees" ? "#1061cd" : "transparent",
      color: filter === "employees" ? "#fff" : "#1061cd",
      border: "1px solid #1061cd",
      fontSize: "13px",
    }}
    onClick={() => setFilter("employees")}
  >
    Employee
  </button>
)}
  {hasStateData && (
  <button
    className="btn"
    style={{
      backgroundColor: filter === "state" ? "#1061cd" : "transparent",
      color: filter === "state" ? "#fff" : "#1061cd",
      border: "1px solid #1061cd",
      fontSize: "13px",
    }}
    onClick={() => setFilter("state")}
  >
    State
  </button>
)}
{entities.length > 0 &&
  entities
    .filter(entity => entity.entityId !== "-1" && entity.entityId !== null)
    .map((entity) => {
      const isActive = filter === entity["field label"];
      return (
        <button
          key={entity.entityId}
          className={`btn-fieldvalue ${isActive ? "active" : ""}`}
          style={{
            backgroundColor: isActive ? "#1061cd" : "transparent",
            color: isActive ? "#fff" : "#1061cd",
            border: "1px solid #1061cd",
            fontSize: "13px",
          }}
          onClick={() => handleFilterChange(entity["field label"], entity.entityId)}
        >
          {entity["field label"]}
        </button>
      );
    })
}
</div>

            </div>
          </div>
        </nav>

        <div className="dragdropdata-container">
          {showLeftButton && (
            <button
              onClick={handleScrollLeft}
              style={{ cursor: "pointer" }}
              className="left_btn"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          )}
          <div
            className="scroll-container"
            ref={scrollContainerRef}
            onScroll={updateScrollButtons}
          ></div>
          {showRightButton && (
            <button
              onClick={handleScrollRight}
              style={{ cursor: "pointer" }}
              className="right_btn"
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
        </div>

        <div>
          <div
            className="overflow-newsss"
            ref={scrollContainerRef}
            style={{
              display: "flex",
              overflowX: "auto",
              whiteSpace: "nowrap",
              padding: "10px",
            }}
          >
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="deals" direction="horizontal">
                {(provided) => (
                  <ul
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="row flex-nowrap list-unstyled"
                  >
                    {filteredDeals.map((listItem, listIndex) => {
                      const listItemKey = Object.keys(listItem)[0];
                      const dealCategory = listItem[listItemKey];
                      const totalAmount = calculateTotalAmount(
                        dealCategory.custom_entity_items
                      );

                      return (
                        <Droppable
                          droppableId={listIndex.toString()}
                          key={listItemKey}
                        >
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="mb-0 list-unstyled-item"
                            >
                              <div className="card h-100">
                                <div
                                  className="card-header bg-light text-center sticky-header"
                                  style={{}}
                                >
                                  <h5
                                    className="card-title text-white d-flex justify-content-between align-items-center"
                                    style={{}}
                                  >
                                    <span
                                      className="italic-smaller-count"
                                      style={{ width: "13%" }}
                                      title={
                                        dealCategory.custom_entity_items
                                          ? dealCategory.custom_entity_items
                                              .length
                                          : 0
                                      }
                                    >
                                      {dealCategory.custom_entity_items
                                        ? dealCategory.custom_entity_items
                                            .length
                                        : 0}
                                    </span>
                                    <span
                                      className="category mx-auto"
                                      style={{ width: "80%" }}
                                    >
                                      <div className="category-container">
                                        <span
                                          className="list-item"
                                          title={listItemKey}
                                        >
                                          {listItemKey}
                                     </span>
                                      <span className="amount-nav" title={totalAmount}>
                                      &#8377; {totalAmount}
                                    </span>
                                      </div>
                                    </span>
                                  </h5>
                                </div>

                                <ul className="card-body view-h list-unstyled">
  {dealCategory.custom_entity_items &&
    dealCategory.custom_entity_items.map((deal, index) => (
      <Draggable
        key={deal.custom_entity_id}
        draggableId={deal.custom_entity_id.toString()}
        index={index}
      >
        {(provided) => (
          <li
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="deal card card-st-1 mb-1"
            onClick={() => handleCardClick(deal)}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div style={{ flex: 1, maxWidth: "70%" }}>
              {Object.entries(deal)
    .filter(
      ([key, value]) =>
        key !== "formId" &&
        key !== "custom_entity_id" &&
        key !== "Status" &&
        key !== "amount" &&
        key !== listItemKey && // Skip the listItemKey
        !/^\d{4}-\d{2}-\d{2}/.test(value) && // Exclude date-like values (e.g., "2024-12-04")
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && // Exclude email addresses
        typeof value === "string" // Ensure value is a string
    )
    .slice(0, 1) // Take only the first entry
    .map(([key, value]) => {
      if (key === "Lead Name" && !value) {
        const fallbackValue = Object.entries(deal)
          .filter(
            ([fallbackKey, fallbackValue]) =>
              fallbackKey !== "amount" &&
              fallbackKey !== "Created On" &&
              fallbackKey !== "Lead Name" &&
              fallbackKey !== "formId" &&
              fallbackKey !== "custom_entity_id" &&
              fallbackKey !== listItemKey && 
              fallbackKey !== "Status" &&
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fallbackValue) && 
              typeof fallbackValue === "string"
          )
          .map(([, fallbackValue]) => fallbackValue)
          .find((val) => val);

        value = fallbackValue || "No Data";
      }
        return (
          <p
            key={key}
            className="card-subtitle mb-3 text-muted-data"
            title={value}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginRight: "10px",
            }}
          >
            {value}
          </p>
        );
      })}
              </div>

              {/* Amount data */}
              <div style={{ flexShrink: 0 }}>
                {Object.entries(deal)
                  .filter(([key]) => key === "amount")
                  .map(([key, value]) => (
                    <p
                      key={key}
                      className="card-subtitle mb-3 text-muted-data"
                      title={value}
                      style={{
                        display: "inline-block",
                        whiteSpace: "nowrap",
                       
                        textAlign: "right",
                      }}
                    >
                      {value}
                    </p>
                  ))}
              </div>
            </div>
            <div className="d-flex justify-content-between">
              <span
                style={{
                  color: "rgb(66 132 221)",
                  fontSize: "all",
                  paddingLeft: "5px",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
                onClick={() => {
                  setSelectedDeal(deal);
                  setDrawerOpen(true);
                }}
              >
                Show more
              </span>
              <span
                className="text-muted-data-date"
                title={getDynamicDate(deal)}
                style={{
                  fontSize: "small",
                  color: "#6c757d",
                }}
              >
                {getDynamicDate(deal)}
              </span>
            </div>
          </li>
        )}
      </Draggable>
    ))}
  {provided.placeholder}
</ul>




                              </div>
                            </li>
                          )}
                        </Droppable>
                      ); //testing
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dragdropdata;
