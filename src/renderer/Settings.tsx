/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import './Settings.css';

function setAutostart() {
  const autostart = document.querySelector('input');
  autostart.addEventListener('click', window.api.send("autostart", autostart?.checked));
}  

export default class Main extends React.Component {
  
  render() {
    return (
      <div id="settingsv">
        <div id="sbb">&larr;</div>
        <p>Hello!</p>
        <input type="checkbox" id="autostart" name="autostart_onoff"></input>
        <label htmlFor="autostart_onoff">App beim Login am Computer automatisch starten</label>
        <button onClick={setAutostart}>Speichern</button>
    </div>
     // </div>
    );
  }
}
