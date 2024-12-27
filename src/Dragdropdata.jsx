import axios from "axios";
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
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dragdropdata.css";

const Dragdropdata = () => {
  const { customEntitySpecId,myEmpId } = useParams();
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
    try {
      // Determine the URL based on the filter
      const url =
        filter === "employees"
          ? // ? `https://testdev.spoors.dev/entity-api/extraService/custom/entity/list/api/?customEntitySpecId=1884`
            // : `https://react.spoors.dev/entity-api/extraService/custom/entity/list/api/?customEntitySpecId=${customEntitySpecId}`;
            `https://staging.spoors.in/effortx/extraService/custom/entity/employee/mapping/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}`
          : `https://staging.spoors.in/effortx/extraService/custom/entity/list/api/?customEntitySpecId=${customEntitySpecId}&myEmpId=${myEmpId}`;
      const response = await axios.get(url);
      const data = response.data;
      // Extract summary data
      if (data.summary) {
        setSummary(data.summary);
      }

      let processedDeals = [];

      if (filter === "employees") {
        if (Array.isArray(data.deals)) {
          processedDeals = data.deals.map((deal) => {
            const key = Object.keys(deal)[0];
            const customEntityItems =
              deal[key]?.custom_entity_items.map((item) => ({
                ...item,
                formId: item.formId, // Preserve the original formId value
              })) || [];
            return {
              [key]: {
                ...deal[key],
                custom_entity_items: customEntityItems,
              },
            };
          });
        } else {
          console.error("Unexpected format for employees data");
        }
      } else {
        if (Array.isArray(data.deals)) {
          processedDeals = data.deals.map((deal) => {
            const key = Object.keys(deal)[0];
            const customEntityItems =
              deal[key]?.custom_entity_items.map((item) => ({
                ...item,
                formId: item.formId, // Preserve the original formId value
              })) || [];
            return {
              [key]: {
                ...deal[key],
                custom_entity_items: customEntityItems,
              },
            };
          });
        } else {
          console.error("Unexpected format for deals data");
        }
      }

      setDeals(processedDeals);
      setFilteredDeals(processedDeals);
    } catch (error) {
      console.error("There was an error fetching the data!", error);
    }
  };

  useEffect(() => {
    fetchData();
    setFilteredDeals(deals);
  }, [filter, customEntitySpecId]);

  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchTerm(searchTerm);
  
    const filteredDeals = deals
      .map((listItem) => {
        const listItemKey = Object.keys(listItem)[0];
        const dealCategory = listItem[listItemKey];
  
        // Filter the items based on the search term across all fields
        const filteredItems = dealCategory.custom_entity_items.filter((deal) => {
          return Object.values(deal).some((value) => {
            return (
              value &&
              typeof value === 'string' &&
              value.toLowerCase().includes(searchTerm)
            );
          });
        });
  
        // Return the category with filtered items if any are found
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
  

  const fetchWithTimeout = (url, options, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeout)
      ),
    ]);
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (filter === "employees") {
      alert("Drag and drop is disabled for employees data.");
      console.log("Drag and drop is disabled for employees");
      return;
    }

    if (!destination) {
      console.log("Dropped outside the list");
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      console.log("Item dropped in the same position");
      return;
    }

    if (!Array.isArray(deals) || deals.length === 0) {
      console.error("Deals array is not defined or empty");
      return;
    }

    const sourceListIndex = parseInt(source.droppableId);
    const destinationListIndex = parseInt(destination.droppableId);

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
    const destinationList = [
      ...destinationDeal[destinationDealKey].custom_entity_items,
    ];

    if (deals.length === 1) {
      console.log("Only one list available");

      if (
        source.droppableId !== destination.droppableId ||
        source.index !== destination.index
      ) {
        console.log("Items cannot be moved within a single list");
        return;
      }
    }

    const [movedItem] = sourceList.splice(source.index, 1);
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
      custom_entity_id: updatedItem.custom_entity_id,
      myEmpId: updatedItem.myEmpId,
      id: updatedItem.id,
    };

    console.log(updatedItem.custom_entity_id + " update");
    console.log("Request Body:");
    console.log("Sending data:", JSON.stringify(requestBody));

    try {
      const response = await fetchWithTimeout(
        `https://staging.spoors.in/effortx/extraService/get/custom/entity/list/mapping?customEntitySpecId=${customEntitySpecId}`,
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
        )
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

  const handleFilterChange = (filterBy) => {
    setFilter(filterBy);
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
  return (
    <div className="container-fluid mt-4-top" style={{ fontSize: '13px' }}>
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
              <div className="dropdown">
                <select
                  style={{ fontSize: "13px" }}
                  className="form-select"
                  aria-label="Filter options"
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="listItems">List items</option>
                  <option value="employees">Employee</option>
                </select>
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
