import React, { useState,useLayoutEffect, useEffect,useRef } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import Box from '@mui/material/Box';
// import Drawer from '@mui/material/Drawer';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
// import Card from '@mui/material/Card';
// import CardContent from '@mui/material/CardContent';
// import CardActions from '@mui/material/CardActions';
// import "./App.css"; 
// import { colors } from "@mui/material";
import "./Dragdropdata.css";
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { size } from "lodash";


const Dragdropdata = () => {
  const { customEntitySpecId } = useParams();
  const [deals, setDeals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [summary, setSummary] = useState({ totalCustomEntities: "0", totalAmount: "0" });
  const [filter, setFilter] = useState('listItems');
  const scrollContainerRef = useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
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
        localStorage.setItem('scrollPosition', scrollContainerRef.current.scrollLeft);
      }
    };
  
    const updateOnResize = () => {
      updateScrollButtons();
    };
  
    // Add event listeners
    window.addEventListener('beforeunload', saveScrollPosition);
    window.addEventListener('resize', updateOnResize);
  
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
      window.removeEventListener('resize', updateOnResize);
    };
  }, []);
  


  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -380,
        behavior: 'smooth',
      });
      setTimeout(updateScrollButtons, 500);
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: +380,
        behavior: 'smooth',
      });
      setTimeout(updateScrollButtons, 500);
    }
  };
// const fetchData =async()=>{
//   try {
//     const url ="http://20.219.207.157:8008/viewCustomEntityKanban";
//     const data =await fetch(url);
//     const res = await JSON.stringify(data);
// alert(res);   
//   } catch (error) {
//     console.error('Error fetching data:', error);
//   }
// }
 


  const fetchData = async () => {
    try {
      // Determine the URL based on the filter
      const url = filter === 'employees'
        // ? `https://testdev.spoors.dev/entity-api/extraService/custom/entity/employee/mapping/api/?customEntitySpecId=${customEntitySpecId}`
        // : `https://testdev.spoors.dev/entity-api/extraService/custom/entity/list/api/?customEntitySpecId=${customEntitySpecId}`;
        ? `http://20.219.207.157:8008/viewCustomEntityKanban`
      : `http://20.219.207.157:8008/viewCustomEntityKanban`;

      const response = await axios.get(url);
      const data = response.data;
      if (data.summary) {
        setSummary(data.summary);
      }

    
      let processedDeals = [];

      if (filter === 'employees') {
        if (Array.isArray(data.deals)) {
          processedDeals = data.deals.map((deal) => {
            const key = Object.keys(deal)[0];
            const customEntityItems = deal[key]?.custom_entity_items.map((item) => ({
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
          console.error("Unexpected format for employees data");
        }
      } else {
        if (Array.isArray(data.deals)) {
          processedDeals = data.deals.map((deal) => {
            const key = Object.keys(deal)[0];
            const customEntityItems = deal[key]?.custom_entity_items.map((item) => ({
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
  }, [filter,customEntitySpecId]);



  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchTerm(searchTerm);
  
    const filteredDeals = deals.map((listItem) => {
      const listItemKey = Object.keys(listItem)[0];
      const dealCategory = listItem[listItemKey];
  
      const filteredItems = dealCategory.custom_entity_items.filter((deal) =>
        (deal["Client"] && deal["Client"].toLowerCase().includes(searchTerm)) ||
        (deal["Status"] && deal["Status"].toLowerCase().includes(searchTerm)) ||
        (deal["Contact Email"] && deal["Contact Email"].toLowerCase().includes(searchTerm)) ||
        (deal["Contact Name"] && deal["Contact Name"].toLowerCase().includes(searchTerm)) ||
        (deal["Phone"] && deal["Phone"].toLowerCase().includes(searchTerm)) ||
        (deal["Source"] && deal["Source"].toLowerCase().includes(searchTerm))
      );
  
      // Return the category with filtered items
      return filteredItems.length > 0 ? {
        [listItemKey]: {
          ...dealCategory,
          custom_entity_items: filteredItems
        }
      } : null;
    }).filter(item => item !== null);
  
    setFilteredDeals(filteredDeals);
    console.log("Filtered Deals:", filteredDeals);
  };

  const fetchWithTimeout = (url, options, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
      )
    ]);
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (filter === 'employees') {
      alert("Drag and drop is disabled for employees data.");
      console.log("Drag and drop is disabled for employees");
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
    const destinationList = [...destinationDeal[destinationDealKey].custom_entity_items];


    if (deals.length === 1) {
      console.log("Only one list available");

      if (source.droppableId !== destination.droppableId || source.index !== destination.index) {
        console.log("Items cannot be moved within a single list");
        return;
      }
    }

    const [movedItem] = sourceList.splice(source.index, 1);
    destinationList.splice(destination.index, 0, movedItem);

    const updatedDeals = deals.map((deal, index) => {
      const dealKey = Object.keys(deal)[0];
      if (index === sourceListIndex) {
        return { ...deal, [dealKey]: { ...deal[dealKey], custom_entity_items: sourceList } };
      }
      if (index === destinationListIndex) {
        return { ...deal, [dealKey]: { ...deal[dealKey], custom_entity_items: destinationList } };
      }
      return deal;
    });

    setDeals(updatedDeals);
    setFilteredDeals(updatedDeals);

    const updatedItem = {
      ...movedItem,
      id: destinationDeal[destinationDealKey].id
    };

    const requestBody = {
      custom_entity_id: updatedItem.custom_entity_id,
      id: updatedItem.id
    };

    console.log(updatedItem.custom_entity_id + " update");
    console.log("Request Body:");
    console.log("Sending data:", JSON.stringify(requestBody));

    try {
      const response = await fetchWithTimeout(`https://testdev.spoors.dev/entity-api/extraService/get/custom/entity/list/mapping?customEntitySpecId=${customEntitySpecId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response Status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Deal updated successfully:", responseData);
        const clientName = movedItem["Client"] || "Unknown Client";
        toast.success(`Item ${clientName} moved from ${sourceDealKey} to ${destinationDealKey}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        fetchData();
      }
      else {
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

    const parentDeal = deals.find(d => Object.values(d)[0].custom_entity_items.some(item => item.custom_entity_id === entityId));
    const customEntitySpecId = parentDeal ? Object.values(parentDeal)[0].custom_entity_specid : '';

    if (!formId || !customEntitySpecId) {
      console.error("formId or customEntitySpecId is missing");
      return;
    }


    const baseUrl = `https://testdev.spoors.dev/entity-api/web/form/data/view/`;
    const dynamicUrl = `${baseUrl}${formId}?customEntitySpecId=${customEntitySpecId}`;

    console.log("dynamicUrl:", dynamicUrl);

    window.open(dynamicUrl, '_blank');
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

  return (
    <div className="container-fluid mt-4-top">
    <ToastContainer />
      <div className="height-fixed-top">
        <nav style={{ paddingTop: '5px' }} className="navbar navbar-light bg-light">
          <form className="form-inline ml-auto">
            <div className="input-group mr-3">
              <input
              style={{fontSize:'13px'}}
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
          
          <div className="nav-data" style={{ paddingRight: '25px' }}>
            <div className="nav-total-data" style={{ display: 'flex', alignItems: 'center', fontSize:'13px' }}>
              <span>Total Entities: {summary.totalCustomEntities} </span>
              <span style={{ marginLeft: '10px' }}>Total Amount: ₹{summary.totalAmount}</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <div className="dropdown">
                <select style={{fontSize:'13px'}}
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
            <button onClick={handleScrollLeft} style={{ cursor: 'pointer' }} className="left_btn">
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          )}
          <div
            className="scroll-container"
            ref={scrollContainerRef}
            onScroll={updateScrollButtons}
          >
          </div>
          {showRightButton && (
            <button onClick={handleScrollRight} style={{ cursor: 'pointer' }} className="right_btn">
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
        </div>

       <div>
        <div className="overflow-newsss" ref={scrollContainerRef} style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px' }}>
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
                    const totalAmount = calculateTotalAmount(dealCategory.custom_entity_items);

                    return (
                      <Droppable droppableId={listIndex.toString()} key={listItemKey}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="mb-0 list-unstyled-item"
                          >
                            
                            <div className="card h-100">
                              <div className="card-header bg-light text-center sticky-header">
                                <h5 className="card-title p-3 mb-1 text-white d-flex justify-content-between align-items-center" style={{background:'#1061cd'}}>
                                  <span className="italic-smaller-count" style={{color:'#1061cd'}} title={dealCategory.custom_entity_items ? dealCategory.custom_entity_items.length : 0}>
                                    {dealCategory.custom_entity_items ? dealCategory.custom_entity_items.length : 0}
                                  </span>
                                  <span className="category mx-auto">
                                    <div className="category-container">
                                      <span className="list-item" title={listItemKey}>{listItemKey}</span>
                                      <span className="amount-nav" title={totalAmount}>₹ {totalAmount}</span>
                                    </div>
                                  </span>
                                </h5>
                              </div>

                              <ul className="card-body view-h list-unstyled">
                                {dealCategory.custom_entity_items && dealCategory.custom_entity_items.map((deal, index) => (
                                  <Draggable key={deal.custom_entity_id} draggableId={deal.custom_entity_id.toString()} index={index}>
                                    {(provided) => (
                                      <li
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="deal card card-st-1 mb-1"
                                        onClick={() => handleCardClick(deal)}
                                      >
                                        <div className="d-flex justify-content-between align-items-center">
                                          <p className="card-subtitle mb-3 text-muted-data name" title={deal["Client"] || "No Client"}>
                                            {deal["Client"] || "No Client"}
                                          </p>
                                    
                                        <p className="card-subtitle mb-3 text-muted-data value" title={deal["Contact Name"] || "No DATA"}>
                                            {deal["Contact Name"] || "No DATA"}
                                          </p>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                          <span
                                            style={{
                                              color: 'rgb(66 132 221)',
                                              fontSize: 'all',
                                              paddingLeft: '5px',
                                              ':hover': {
                                                textDecoration: 'underline',
                                                cursor: 'pointer'
                                              }
                                            }}
                                            onClick={() => {
                                              setSelectedDeal(deal);
                                              setDrawerOpen(true);
                                            }}
                                          >
                                            Show more
                                          </span>
                                          {/* <span className="text-muted-data-date" title={deal.custom_entity_id}>{deal.custom_entity_id}</span> */}
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
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
</div>
        {/* 
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: '100%' } }}
        >
          <Box className="centered-box">
            {selectedDeal && (
              <Card
                className="custom-card"
                sx={{
                  boxShadow: 3,
                  width: '100%',
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#101010' : '#fff'),
                  color: (theme) => (theme.palette.mode === 'dark' ? '#fff' : '#000'),
                  borderRadius: 1,
                }}
              >
                <CardContent>
                  <Typography variant="h6" component="div">
                    {selectedDeal["Entity Name"]}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    {selectedDeal["Pick List"]}
                  </Typography>
                  <Typography variant="body2">
                    {selectedDeal.custom_entity_id}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => setDrawerOpen(false)}>Close</Button>
                </CardActions>
              </Card>
            )}
          </Box>
        </Drawer> */}
      </div>
    </div>
  );
};

export default Dragdropdata;
