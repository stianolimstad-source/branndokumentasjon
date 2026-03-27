import Konsept from "./Konsept";

/**
 * Tilstandsvurdering page – a thin wrapper around Konsept
 * that forces documentType to "tilstandsvurdering".
 * The Konsept component reads the `type` search param to determine mode.
 */
const Tilstandsvurdering = () => {
  return <Konsept />;
};

export default Tilstandsvurdering;
