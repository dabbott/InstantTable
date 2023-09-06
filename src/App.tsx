import "./App.css";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

import { init, transact, tx, useQuery } from "@instantdb/react";

const APP_ID = "6a0e56c8-f847-4890-8ae9-06bba6249d34";

init({
  appId: APP_ID,
  websocketURI: "wss://api.instantdb.com/runtime/session",
});

const singletonId = "0c1b1794-87de-4b3c-8f11-b7b66290ffb0";

type CounterData = { counters: { count?: number }[] };

function Counter({ data }: { data: CounterData }) {
  const counter = data.counters[0];
  console.log("⚡ + " + JSON.stringify(counter));
  const count = counter?.count || 0;

  return (
    <button
      onClick={() =>
        transact([tx.counters[singletonId].update({ count: count + 1 })])
      }
    >
      {count}
    </button>
  );
}

function App() {
  const query = {
    counters: {
      $: {
        where: {
          id: singletonId,
        },
      },
    },
  };
  const { isLoading, data } = useQuery(query) as {
    isLoading: boolean;
    data: CounterData;
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">{!isLoading && <Counter data={data} />}</div>
    </>
  );
}

export default App;
