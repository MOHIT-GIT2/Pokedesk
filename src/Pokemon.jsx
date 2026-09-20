import { useEffect, useState } from "react";
import "./index.css";
import PokemonCards from "./PokemonCards";

const Pokemon = () => {
  //const API = "https://pokeapi.co/api/v2/pokemon?limit=24";
  const [pokemon, setPokemon] = useState([]);
  const [loading, setloading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [nextUrl, setNextUrl] = useState(
    "https://pokeapi.co/api/v2/pokemon?limit=24",
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [allNames, setAllNames] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const fetchPokemon = async (url) => {
    try {
      setLoadingMore(true);

      //fetches api reponse status
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error");
      }

      //fetches data
      const data = await response.json();
      //   console.log(data);

      //sets the next url for pagination
      setNextUrl(data.next);

      //data has array so we loop and 124 promises gets stored
      const detailedPokemon = data.results.map(async (curPokemon) => {
        const pokeResponse = await fetch(curPokemon.url);
        const pokeData = await pokeResponse.json();
        return pokeData;
      });
      //   console.log(detailedPokemon);

      //getting each data from 124 promises
      const detailedPokemonRespones = await Promise.all(detailedPokemon);
      //   console.log(detailedPokemonRespones);

      setPokemon((previous) => {
        const oldIds = new Set(previous.map((p) => p.id));
        const newIds = detailedPokemonRespones.filter((p) => !oldIds.has(p.id));
        return [...previous, ...newIds];
      });
      setloading(false);
    } catch (error) {
      console.log(error);
      setloading(false);
      setError(error);
    } finally {
      setLoadingMore(false);
    }
  };

  //starts from here
  useEffect(() => {
    fetchPokemon(nextUrl);
  }, []);

  useEffect(() => {
    const fetchAllNames = async () => {
      try {
        const response = await fetch(
          "https://pokeapi.co/api/v2/pokemon?limit=10000",
        );
        const data = await response.json();
        setAllNames(data.results);
      } catch (error) {
        console.log(error);
      }
    };
    fetchAllNames();
  }, []);

  //search functionality

  // const searchData = pokemon.filter((curPokemon) =>
  //   curPokemon.name.toLowerCase().includes(search.toLowerCase()),
  // );

  const matchNames = search
    ? allNames.filter((p) =>
        p.name.toLowerCase().includes(search.toLocaleLowerCase()),
      )
    : [];

  useEffect(() => {
    const fetchMatches = async () => {
      const toFetch = matchNames.slice(0, 124);

      const details = await Promise.all(
        toFetch.map(async (p) => {
          const res = await fetch(p.url);
          return res.json();
        }),
      );

      setSearchResults(details);
    };

    fetchMatches();
  }, [search]);

  const displayList = search ? searchResults : pokemon;

  if (loading) {
    return (
      <div>
        <h1>Loading....</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>{error.message}</h1>
      </div>
    );
  }
  return (
    <>
      <section className="container">
        <header>
          <h1>Pokémons Pokedesk</h1>
        </header>
        <div className="pokemon-search">
          <input
            type="text"
            placeholder="search Pokemon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <ul className="cards">
            {/* {pokemon.map((curPokemon) => { */}

            {displayList.map((curPokemon) => {
              return (
                <PokemonCards key={curPokemon.id} pokemonData={curPokemon} />
              );
            })}
          </ul>
          {nextUrl && !search && (
            <button
              onClick={() => fetchPokemon(nextUrl)}
              disabled={loadingMore}
              className="load-more-btn"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </section>
    </>
  );
};

export default Pokemon;
