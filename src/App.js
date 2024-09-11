import React, { useState } from 'react';
import { ethers } from "ethers";
import { PoapDisplay } from './PoapDisplay';

const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`);

function App() {
  const [identifier, setIdentifier] = useState('');
  const [poaps, setPoaps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL

  const resolveENS = async (searchTerm) => {
    let address 
    if (searchTerm.endsWith('.eth')) {
      address = await provider.resolveName(searchTerm);
      if (!address) {
        setError('Invalid ENS')
        return 
      }
    } else {
      address = searchTerm
    }
    return address
  }

  const fetchPOAPs = async (address) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              poaps(
                where: { collector_address: { _eq: "${address.toLowerCase()}" } }
                order_by: {minted_on: desc}
              ) {
                id
                drop_id
                collector_address
                drop {
                  image_url
                  name
                }
              }
            }
          `,
        }),
      });
      const result = await response.json();
      if (result.data.poaps.length === 0) {
        setError('No POAPs found for this identifier');
      }
      setPoaps(result.data.poaps);
    } catch (err) {
      setError(err.message || 'An error occured');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (identifier.trim() === '') {
      setError('Please enter a valid identifier (address or ENS)');
      return;
    }
    setLoading(true);
    setError('');
    setPoaps([]);

    const address = await resolveENS(identifier)
    if (!address) {
      setLoading(false)
      return
    } 
    try {
      fetchPOAPs(address);
    } catch (err) {
      setError(err.message || 'An error occurred');
      setLoading(false)
    }
  };

  const handleReset = () => {
    setIdentifier('');
    setPoaps([]);
    setError('');
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} >
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Address or ENS"
          className="input"
        />
        <button type="submit" className="button">Search</button>
        <button type="button" className="button" onClick={handleReset}>Reset</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="container">
        {poaps.length > 0 && <PoapDisplay poaps={poaps} />}
      </div>
    </div>
  );
}

export default App;