I'll implement comprehensive filtering for the Services page, similar to the enhancements made for the Instances page.

### **Plan for Services Page Filtering**

1.  **Add Filter State**: Introduce state variables for `statusFilter`, `typeFilter`, `regionFilter`, and `sortBy`.
2.  **Derive Filter Options**: Dynamically extract unique service types and regions from the current services list.
3.  **Implement Filtering Logic**: Filter services based on status (online/offline/archived), type, and region.
4.  **Implement Sorting Logic**: Sort services by newest, name, or instance count.
5.  **Create Filter UI**: Add a clean, modern toolbar above the service grid with dropdowns for filters and sorting.
6.  **Update Empty State**: Enhance the empty state to allow clearing all filters.

### **Key Changes**

*   **Status Filter**: Handle 'online', 'offline', and 'archived' (using the `is_archived` flag).
*   **Type Filter**: Dynamically list all unique service types (e.g., 'api', 'worker').
*   **Region Filter**: Dynamically list all unique regions (e.g., 'us-east-1', 'eu-west-1').
*   **Sort By**: Add options for 'Newest', 'Name A-Z', and 'Most Instances'.

### **UI Integration**

*   The new filter toolbar will be placed between the header and the service grid.
*   It will use the same clean, modern style as the instances page filters, with clear labels and icons.
*   The existing "Add New Service" card will remain at the end of the filtered grid.

This will provide a powerful and intuitive way to manage large numbers of services, allowing users to quickly find and focus on specific deployments.