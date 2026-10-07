import { useEffect, useState } from "react";
import "./index.css";
import PokemonCards from "./PokemonCards";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

const Pokemon = () => {
  const API = "https://pokeapi.co/api/v2/pokemon?limit=24";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchPokemon2 = async ({ pageParam }) => {
    const response = await fetch(pageParam);
    const data = await response.json();

    //data has array so we loop and 124 promises gets stored
    const detailedPokemon = data.results.map(async (curPokemon) => {
      const pokeResponse = await fetch(curPokemon.url);
      const pokeData = await pokeResponse.json();
      return pokeData;
    });
    //   console.log(detailedPokemon);

    //getting each data from 124 promises
    const detailedPokemonResponses = await Promise.all(detailedPokemon);
    //return detailedPokemonResponses;
    return {
      pokemon: detailedPokemonResponses,
      next: data.next,
    };
  };

  //this is been replaced by infinityQuery for pagination
  // const query = useQuery({
  //   queryKey: ["pokemon"],
  //   queryFn: fetchPokemon2,
  // });

  //initialParams is to tell where it starts
  const query = useInfiniteQuery({
    queryKey: ["pokemon"],
    queryFn: fetchPokemon2,
    initialPageParam: API,
    getNextPageParam: (lastPage) => lastPage.next,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAllNames = async () => {
    const response = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=10000",
    );
    const data = await response.json();
    return data.results;
  };

  const queryAllNames = useQuery({
    queryKey: ["pokemonNames"],
    queryFn: fetchAllNames,
  });

  const allNames = queryAllNames.data ?? [];

  const matchNames = debouncedSearch
    ? allNames.filter((p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : [];

  const fetchPokemonDetails = async (matchNames, signal) => {
    const toFetch = matchNames.slice(0, 124);

    const details = await Promise.all(
      toFetch.map(async (p) => {
        const res = await fetch(p.url, { signal });
        return res.json();
      }),
    );
    return details;
  };

  const pokemonDetails = useQuery({
    queryKey: ["pokemonSearch", debouncedSearch],
    queryFn: ({ signal }) => fetchPokemonDetails(matchNames, signal),
  });

  console.log(pokemonDetails);

  const allPokemon = query.data?.pages.flatMap((page) => page.pokemon) ?? [];

  const displayList = debouncedSearch
    ? (pokemonDetails.data ?? [])
    : allPokemon;

  if (query.isPending) {
    return (
      <div>
        <h1>Loading....</h1>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div>
        <h1>{query.error.message}</h1>
        {/* {console.log(query.error.message)} */}
      </div>
    );
  }

  // if (search && pokemonDetails.isPending) {
  //   return <h1>Searching...</h1>;
  // }

  // if (search && pokemonDetails.isError) {
  //   return <h1>{pokemonDetails.error.message}</h1>;
  // }
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
          {query.hasNextPage && !search && (
            <button
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="load-more-btn"
            >
              {query.isFetchingNextPage ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </section>
    </>
  );
};

export default Pokemon;
