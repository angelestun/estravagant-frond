import React, { useState } from 'react';
import ProductListComponent from './ProductListComponent';
import CartComponent from './CartComponent';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const Dashboard = () => {
  const [cartItems, setCartItems] = useState([]);

  return (
    <Router>
      <Switch>
        <Route path="/store">
          <ProductListComponent setCartItems={setCartItems} />
        </Route>
        <Route path="/carrito">
          <CartComponent cartItems={cartItems} />
        </Route>
        
      </Switch>
    </Router>
  );
};

export default Dashboard;
