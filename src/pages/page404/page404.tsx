import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function page404() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 0);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div>
      <p>não achou nada guerreiro</p>
    </div>
  );
}
