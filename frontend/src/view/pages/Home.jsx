import { useEffect, useState } from "react";
import api from "../../services/api";

function Home() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api
      .get("/auth/users-test")
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.error("API error:", err);
      });
  }, []);

  return (
    <div>
      <h2>Home Page</h2>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}

export default Home;
