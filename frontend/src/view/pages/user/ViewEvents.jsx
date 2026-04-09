// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../../../services/api';
// import toast from 'react-hot-toast';

// const ViewEvents = () => {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   // Fetch approved events when the component loads
//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   const fetchEvents = async () => {
//     try {
//       const res = await api.get('/events/approved');
//       // Adjust this based on whether your API returns res.data or res.data.data
//       setEvents(res.data.data || res.data);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//       toast.error("Failed to load events");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePayment = async (eventId, ticketPrice) => {
//     try {
//       console.log("0. INITIATING PAYMENT FOR EVENT:", eventId);
      
//       // 1. Initialize Order
//       const initRes = await api.post('/events/user/init-payment', { eventId, ticket_price: ticketPrice });
//       const { orderId, amount, currency } = initRes.data;

//       // 2. Open Razorpay Checkout
//       const options = {
//         key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Ensure this exists in your frontend .env
//         amount: amount,
//         currency: currency,
//         name: "Event Registration",
//         order_id: orderId,
//         handler: async function (response) {
//           console.log("1. RAZORPAY PAYMENT SUCCESS. HANDLER TRIGGERED.");
//           console.log("PAYMENT PAYLOAD:", response);
          
//           try {
//             // 3. Verify Payment on Backend
//             const verifyRes = await api.post('/events/user/verify-payment', {
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_signature: response.razorpay_signature,
//               eventId: eventId
//             });

//             console.log("2. BACKEND RESPONSE RECEIVED:", verifyRes.data);

//             if (verifyRes.data.success) {
//               console.log("3. SUCCESS CONDITION MET. ATTEMPTING NAVIGATION...");
//               toast.success("Payment successful! Redirecting to ticket...");
              
//               // This is the line that redirects the user.
//               // If it fails, your /view-ticket route does not exist in AppRoutes.jsx
//               navigate('/view-ticket', { state: { registration: verifyRes.data.data } });
//             } else {
//               console.error("4. BACKEND RETURNED FALSE FOR SUCCESS FLAG:", verifyRes.data);
//               toast.error("Payment verified, but registration failed.");
//             }
//           } catch (verifyError) {
//             console.error("5. CATCH BLOCK TRIGGERED. API CALL FAILED:", verifyError);
//             toast.error("Payment verification failed. Do not refresh.");
//           }
//         },
//         theme: { color: "#3399cc" }
//       };

//       const rzp1 = new window.Razorpay(options);
//       rzp1.open();

//     } catch (error) {
//       console.error("INIT FAILED:", error);
//       toast.error("Failed to initialize payment.");
//     }
//   };

//   if (loading) {
//     return <div className="p-8 text-center text-lg">Loading events...</div>;
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <h1 className="text-3xl font-bold mb-8 text-gray-800">Available Events</h1>
      
//       {events.length === 0 ? (
//         <p className="text-gray-500">No events currently available.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {events.map(event => (
//             <div key={event.id} className="bg-white border rounded-lg p-6 shadow hover:shadow-lg transition">
//               <h2 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h2>
//               <p className="text-gray-600 mb-4">{new Date(event.event_date).toLocaleDateString()}</p>
              
//               <div className="flex justify-between items-center mt-4">
//                 <span className="text-lg font-bold text-gray-800">
//                   ₹{event.ticket_price}
//                 </span>
//                 <button
//                   onClick={() => handlePayment(event.id, event.ticket_price)}
//                   className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-medium"
//                 >
//                   Register & Pay
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ViewEvents;