import logo from '../logo.svg';
import '../css/App.css';
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Main from './Main';



function App() {
  return (
    <div>
      <Header></Header>
      <Main></Main>
      <Footer></Footer>
    </div>
  );
}

export default App;
