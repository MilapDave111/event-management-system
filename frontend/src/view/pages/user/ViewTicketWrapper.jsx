// import React from 'react';
// import { useLocation, Navigate } from 'react-router-dom';
// import ViewTicket from './ViewTicket';

// const ViewTicketWrapper = () => {
//   const location = useLocation();
//   const registration = location.state?.registration;

//   if (!registration) {
//     // If a user navigates here directly without paying, kick them out.
//     return <Navigate to="/dashboard" />;
//   }

//   return (
//     <div className="pt-20 pb-10 min-h-screen bg-gray-50 flex items-center justify-center">
//       <ViewTicket registration={registration} />
//     </div>
//   );
// };

// export default ViewTicketWrapper;