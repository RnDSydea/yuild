import React, { useState, useEffect } from "react";
import "./home.scss";
import "../../yuild-style.scss";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import TextArea from "../../components/textArea/textArea";
import RadioButton from "../../components/radio/radio";
import Checkbox from "../../components/checkbox/checkbox";
import Select from "../../components/select/select";
import Toast from "../../components/toast/toast";
import Card from "../../components/card/card";
import YuildHeader from "../../components/yUildHeader/yUildHeader";
import YuildBody from "../../components/yUildBody/yUildBody";
import YuildFooter from "../../components/yUildFooter/yUildFooter";
import Alert from "../../components/alert/alert";
import Table from "../../components/table/table";
import Dialog from "../../components/dialog/dialog";
import Drawer from "../../components/drawer/drawer";
import TrashIcon from '../../assets/trash-solid.svg';
import DownloadIcon from '../../assets/download-icon.svg';
import ArrowUp from '../../assets/arrow-up.svg';
import HandIcon from '../../assets/drag-hand.svg';
import ComponentsData from "../../assets/data/components.json";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { render } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import GithubLogo from "../../assets/logo/github-mark-white.png";
import YuildLogoLight from "../../assets/logo/yuild-logo-light.svg";

const ColorPicker = ({ colorProps, textProps }) => {
  return (
    <span className="color-picker-container">
      <input type="color" {...colorProps} />
      <input type="text" className="input-props-comp" {...colorProps} />
    </span>
  );
};

export const Home = () => {
  const navigate = useNavigate();

  const [editorMode, setEditorMode] = useState(true);
  const [numColumns, setNumColumns] = useState(24);
  const [numRows, setNumRows] = useState(72);
  const [grid, setGrid] = useState([]);
  const [highlightsCell, setHighlightsCell] = useState([]);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [patchObj, setPatchObj] = useState([]);
  const [selectedProps, setSelectedProps] = useState({});
  const [selecteIdPatch, setSelectedIdPatch] = useState('');
  const [currentCode, setCurrentCode] = useState({});
  const [currentCodeHighlight, setCurrentCodeHighlight] = useState('');
  const [highlightedCode, setHighlightedCode] = useState('');
  const [toggleComponent, setToggleComponent] = useState(true);
  const [cssIncluded, setCssIncluded] = useState(true);
  const [backgroundColorPage, setBackgroundColorPage] = useState('#ffffff');
  const [documentName, setDocumentName] = useState('MyYUildApp');
  

  const initGrid = () => {
    const newGrid = [];
    let index = 0;
    for (let i = 0; i < numRows; i++) {
      newGrid.push([]);
      for (let j = 0; j < numColumns; j++) {
        index++;
        newGrid[i].push({
          id: "yuild-" + index,
          lunghezza: 1,
          componente: null,
          componentId: null,
          number: index,
        });
      }
    }
    setGrid(newGrid);
  };

  useEffect(() => {
    const prevValues = localStorage.getItem('yuild-builded-page');
    if (prevValues)
    setPatchObj(JSON.parse(prevValues));
  }, []);

  useEffect(() => {
    initGrid();
  }, [numColumns, numRows]);

  const getFormattedTimestamp = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year}-${hours}:${minutes}:${seconds}`;
  };

  const handleDragStart = (component) => {
    if(!editorMode){
      return;
    }
    const uniqueId = `comp-${getFormattedTimestamp()}`;
    setDraggedComponent({ ...component, componentId: uniqueId });
  };

  const handleDrop = (index_row, index_col) => {
    if (!draggedComponent) {
      return;
    }

    const { lunghezza: newLunghezza, altezza: newAltezza } = draggedComponent;
    const cellsToFill = calculateCellsToFill(
      index_row,
      index_col,
      newLunghezza,
      newAltezza
    );

    const exceedsLastRow = cellsToFill.some((cell) => cell.row >= numRows);
    if (exceedsLastRow) {
      setNumRows((prevNumRows) => prevNumRows + 1);
      return;
    }

    const isOccupied = cellsToFill.some(
      (cell) =>
        grid[cell.row] &&
        grid[cell.row][cell.columns] &&
        grid[cell.row][cell.columns].componente
    );

    if (isOccupied) {
      setHighlightsCell([]);
      return;
    }

    const newGrid = [...grid];
    cellsToFill.forEach(({ row, columns }) => {
      newGrid[row][columns] = {
        ...newGrid[row][columns],
        lunghezza: newLunghezza,
        componente: draggedComponent.nome,
        componentId: draggedComponent.componentId,
      };
    });

    const firstCellId = newGrid[cellsToFill[0].row][cellsToFill[0].columns].id;
    const lastCellId =
      newGrid[cellsToFill[cellsToFill.length - 1].row][
        cellsToFill[cellsToFill.length - 1].columns
      ].id;

    const topCell = document.getElementById(firstCellId);
    const bottomCell = document.getElementById(lastCellId);

    const top = topCell.offsetTop;
    const left = topCell.offsetLeft;
    const bottom = bottomCell.offsetTop + bottomCell.offsetHeight;
    const right = bottomCell.offsetLeft + bottomCell.offsetWidth;

    const width = right - left;
    const height = bottom - top;

    const overlay_component = {
      id: draggedComponent.componentId,
      component: draggedComponent.nome,
      componentId: draggedComponent.componentId,
      render: draggedComponent.render,
      top,
      left,
      width,
      height,
      props: draggedComponent.props,
      cellsFilled: cellsToFill,
    };

    const newPatchObj = [...patchObj];
    newPatchObj.push(overlay_component);

    setGrid(newGrid);
    setDraggedComponent(null);
    setHighlightsCell([]);
    setPatchObj(newPatchObj);
    localStorage.setItem('yuild-builded-page', JSON.stringify(newPatchObj));
  };

  const handleDragOver = (index_row, index_col) => {
    if (draggedComponent) {
      const { lunghezza, altezza } = draggedComponent;
      const cellHighlightBorder = calculateCellsToFill(
        index_row,
        index_col,
        lunghezza,
        altezza
      );

      const totalNeededRows = index_row + altezza;

      if (totalNeededRows > numRows) {
        setNumRows(totalNeededRows);
      }

      const isOccupied = cellHighlightBorder.some(({ row, columns }) => {
        return (
          grid[row] &&
          grid[row][columns] &&
          grid[row][columns].componente !== null
        );
      });

      const highlights = cellHighlightBorder.map(({ row, columns }) => ({
        row,
        columns,
        occupied: isOccupied,
      }));

      setHighlightsCell(highlights);
    } else {
      setHighlightsCell([]);
    }
  };

  const handleDragLeave = () => {
    setHighlightsCell([]);
  };

  const calculateCellsToFill = (index_row, index_col, lunghezza, altezza) => {
    const cells = [];
    for (let i = 0; i < altezza; i++) {
      for (let j = 0; j < lunghezza; j++) {
        const cellIndex_row = index_row + i;
        const cellIndex_col = index_col + j;
        if (cellIndex_row < numRows && cellIndex_col < numColumns) {
          cells.push({ row: cellIndex_row, columns: cellIndex_col });
        }
      }
    }
    return cells;
  };

  const handlePatchClick = (index) => {
    const newPatchObj = patchObj.map((patch, i) => ({
      ...patch,
      selected: i === index ? !patch.selected : false,
    }));
    setPatchObj(newPatchObj);
    setSelectedProps(patchObj[index].props);
    document.addEventListener("click", handleOutsideClick);
    setSelectedIdPatch(index);
  };

  const handleOutsideClick = (event) => {
    const isClickOutside = !event.target.closest(".component-overlay");
    if (isClickOutside) {
      deselectComponent();
      document.removeEventListener("click", handleOutsideClick);
      setSelectedProps({});
      setSelectedIdPatch('');
    }
  };

  const deselectComponent = () => {
    setPatchObj((prevPatchObj) =>
      prevPatchObj.map((patch) => ({
        ...patch,
        selected: false,
      }))
    );
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const handleDeletePatch = (index) => {
    const patchToDelete = patchObj[index];
    const { top, left, width, height } = patchToDelete;
    const cellsToFree = [];

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = document.getElementById(grid[row][col].id);
        if (
          cell.offsetTop >= top &&
          cell.offsetTop < top + height &&
          cell.offsetLeft >= left &&
          cell.offsetLeft < left + width
        ) {
          cellsToFree.push({ row, col });
        }
      }
    }

    const updatedGrid = [...grid];
    cellsToFree.forEach(({ row, col }) => {
      updatedGrid[row][col] = {
        ...updatedGrid[row][col],
        lunghezza: 1,
        componente: null,
        componentId: null,
      };
    });

    const updatedPatchObj = patchObj.filter(
      (_, patchIndex) => patchIndex !== index
    );
    setGrid(updatedGrid);
    setPatchObj(updatedPatchObj);
    setSelectedProps({});
    setSelectedIdPatch('');
    localStorage.setItem('yuild-builded-page', JSON.stringify(updatedPatchObj));
  };

  const handleDeletePatchClick = (event, index) => {
    event.stopPropagation();
    handleDeletePatch(index);
  };

  const handleDeletePatchFromProps= () => {
    handleDeletePatch(selecteIdPatch);
  };

  const handleDownloadZip = () => {
    // const zip = new JSZip();

    // patchObj.forEach((component) => {
    //   const fileName = `test.html`;
    //   const htmlContent = generateHtmlFile(component);
    //   zip.file(fileName, htmlContent);
    // });

    // zip.generateAsync({ type: 'blob' }).then((content) => {
    //   saveAs(content, 'components.zip');
    // });
    // console.log('patchObj', patchObj);

    // let htmlString = '';
    // const rows = {};

    // // Creiamo una struttura di righe
    // patchObj.forEach((item) => {
    //   item.cellsFilled.forEach((cell) => {
    //     if (!rows[cell.row]) {
    //       rows[cell.row] = [];
    //     }
    //     // Aggiungiamo il componente nella riga specificata
    //     rows[cell.row].push(`<${item.component.toLowerCase()} id="${item.id}" />`);
    //   });
    // });

    // // Ora generiamo il codice HTML per ciascuna riga
    // for (let row in rows) {
    //   htmlString += `<div class="row" style="display: flex;">${rows[row].join('')}</div>`;
    // }
    // setCurrentCode(htmlString);

    const htmlString = generateReactCode();
    setCurrentCode(htmlString);

    console.log(JSON.stringify(htmlString));
    const codeHighlighted = highlightSyntax(htmlString);
    setCurrentCodeHighlight(htmlString);

    return;
    const zip = new JSZip();
    const fileName = `test.js`;
    // const htmlContent = generateHtmlFile(htmlString);
    zip.file(fileName, htmlString);

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "components.zip");
    });
  };

  const generateReactCode = () => {
    const usedComponents = new Set();

    patchObj.forEach((item) => {
      usedComponents.add(item.component);
    });

    let imports = "import React from 'react';\n";

    if (usedComponents.has("Button"))
      imports += "import Button from '../../components/input/button/button';\n";
    if (usedComponents.has("Input"))
      imports += "import Input from '../../components/input/input/input';\n";
    if (usedComponents.has("TextArea"))
      imports +=
        "import TextArea from '../../components/input/textArea/textArea';\n";
    if (usedComponents.has("RadioButton"))
      imports +=
        "import RadioButton from '../../components/input/radio/radio';\n";
    if (usedComponents.has("Checkbox"))
      imports +=
        "import Checkbox from '../../components/input/checkbox/checkbox';\n";
    if (usedComponents.has("Select"))
      imports += "import Select from '../../components/input/select/select';\n";
    if (usedComponents.has("Toast"))
      imports += "import Toast from '../../components/input/toast/toast';\n";
    if (usedComponents.has("Card"))
      imports += "import Card from '../../components/input/card/card';\n";
    if (usedComponents.has("YuildHeader"))
      imports +=
        "import YuildHeader from '../../components/input/yUildHeader/yUildHeader';\n";
    if (usedComponents.has("YuildBody"))
      imports +=
        "import YuildBody from '../../components/input/yUildBody/yUildBody';\n";
    if (usedComponents.has("YuildFooter"))
      imports +=
        "import YuildFooter from '../../components/input/yUildFooter/yUildFooter';\n";
    if (usedComponents.has("Alert"))
      imports += "import Alert from '../../components/input/alert/alert';\n";
    if (usedComponents.has("Table"))
      imports += "import Table from '../../components/input/table/table';\n";
    if (usedComponents.has("Dialog"))
      imports += "import Dialog from '../../components/input/dialog/dialog';\n";
    if (usedComponents.has("Drawer"))
      imports += "import Drawer from '../../components/input/drawer/drawer';\n";

    let jsx = "const App = () => (\n  <div>\n";

    const rows = {};

    patchObj.forEach((item) => {
      item.cellsFilled.forEach((cell) => {
        if (!rows[cell.row]) {
          rows[cell.row] = [];
        }

        const ComponentTag = item.component;
        const props = item.props;
        let propsString = JSON.stringify(props)
          .replace(/"(\w+)":/g, "$1=")
          .replace(/"([^"]+)"/g, '"$1"');
          // .replace(/{/g, '')
          // .replace(/}/g, '');

        rows[cell.row].push(`<${ComponentTag} ${propsString} />`);
      });
    });

    Object.keys(rows).forEach((row) => {
      jsx += `    <div key={${row}} className="row" style={{ display: 'flex' }}>\n`;
      rows[row].forEach((component) => {
        jsx += `      ${component}\n`;
      });
      jsx += `    </div>\n`;
    });

    jsx += "  </div>\n);\n";

    return imports + jsx + "export default App;";
  };

  const highlightSyntax = (code) => {
    // // Escape HTML characters
    // code = code
    //   .replace(/&/g, '&amp;')
    //   .replace(/</g, '&lt;')
    //   .replace(/>/g, '&gt;');
  
    // // Highlight syntax with regex
    // code = code
    //   .replace(/\b(import|from|const|export|default)\b/g, '<span class="keyword">$1</span>') // keywords
    //   .replace(/("[^"]*"|'[^']*')/g, '<span class="string">$1</span>') // strings with single or double quotes
    //   .replace(/(\b\w+\b)(?=\s*={)/g, '<span class="property">$1</span>'); // object properties
  
    // return code;

    const keywords = ['import', 'const', 'let', 'function'];
    const codeWithMarkup = code.replace(/\b(import|const|let|function)\b/g, '<span class="keyword">$1</span>');
    return codeWithMarkup;

  };

  const clearAll = () => {
    const updatedGrid = [...grid];
    for (let i = 0; i < updatedGrid.length; i++) {
      for (let j = 0; j < updatedGrid[i].length; j++) {
        updatedGrid[i][j] = {
          id: updatedGrid[i][j].id,
          lunghezza: 1,
          componente: null,
          componentId: null,
        };
      }
    }
    setPatchObj([]);
    setGrid(updatedGrid);
    setSelectedProps({});
    setSelectedIdPatch('');
    localStorage.setItem('yuild-builded-page', '');
  };

  const componentMap = {
    Button,
    Input,
    TextArea,
    RadioButton,
    Checkbox,
    Select,
    Toast,
    Card,
    YuildHeader,
    YuildBody,
    YuildFooter,
    Alert,
  };

  const handleInputChangeProps = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    const keys = name.split(".");

    const updatedSelectedProps = { ...selectedProps };
    let ref = updatedSelectedProps;

    keys.slice(0, -1).forEach((key) => {
      if (!ref[key]) ref[key] = {};
      ref = ref[key];
    });
    ref[keys[keys.length - 1]] = newValue;
    setSelectedProps(updatedSelectedProps);

    const newPatchObj = patchObj.map((patch) =>
      patch.selected ? { ...patch, props: updatedSelectedProps } : patch
    );
    setPatchObj(newPatchObj);
    localStorage.setItem('yuild-builded-page', JSON.stringify(newPatchObj));
  };

  const handleInputDocName = (e) => {
    setDocumentName(e.target.value);
  };

  const navigateToLibrary = () => {
    navigate("/library");
  };

  const handleColorChange = (newColor) => {
    setBackgroundColorPage(newColor.target.value);
  };

  return (
    <div>
      <div className="yuild-header">
        <div className="y-d-flex y-gap-4 y-align-items-center">
          <img src={YuildLogoLight} className="yuild-logo-header" />
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span>Editor mode</span>
            <div className="yuild-toggle-container">
              <input
                type="checkbox"
                className="yuild-toggle-checkbox"
                id="checkbox"
                checked={editorMode}
                onChange={(e) => setEditorMode(e.target.checked)}
              ></input>
              <label className="yuild-toggle-switch" htmlFor="checkbox">
                <span className="yuild-toggle-slider"></span>
              </label>
            </div>
          </div>
          <Button
            label="Go to Library UI"
            theme="sap"
            onClick={() => navigateToLibrary()}
            disabled
          />
        </div>
        <Select 
            options={[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' },
            ]} 
            // onChange={handleSelectChange} 
            variant="default" 
            theme="material"
          />
        <div className="y-d-flex y-gap-4 y-align-items-center">
          <Button label="Show Editor" onClick={handleDownloadZip} disabled/>
          <Button label="Clear" onClick={clearAll} />
          <button className="btn-header-yuild" onClick={handleDownloadZip}>
            <img src={DownloadIcon} className="img-logo-btn"></img>
          </button>
          <div className="y-d-flex y-align-items-center y-gap-2">
            <a
              href="https://github.com/RnDSydea/y-uild"
              target="_blank"
              className="y-d-flex y-align-items-center y-gap-2 y-link"
            >
              <img src={GithubLogo} alt="Github" className="logo-github" />
              </a>
              <span className="y-d-flex y-align-items-center y-gap-2">by </span>
              <a href="https://www.sydea.com" target="_blank">
                <span className="y-d-flex" style={{width:'60px'}}>
                  <svg id="Livello_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 772 188.18">
                    <path d="M451.1,57v76.3c0,14.2-2.8,25.3-8.4,33.1-5.6,7.8-14.8,13.3-27.5,16.5s-30.3,4.8-52.9,4.8h-88.6v-68.8l43.6-66.5v103.2h43c12.3,0,21.7-.5,27.9-1.6,6.3-1.1,10.8-3.1,13.6-6.2,2.8-3.1,4.2-7.9,4.2-14.5V56.1c0-8.9-3.5-15.1-10.5-18.7-6.6-3.4-16.9-5.1-30.8-5.3h-.8l-71.2.1-48.8,79.7v75.8h-45.1v-75.2l-48.8-80.7c-31.3.1-68.8.4-76.7.4-15.2,0,1.5.1-7.4.1-12.2,0-20.7,10-20.7,15.8v10.5c0,9.8,8.3,14.8,24.9,14.8h38.1c21.4,0,36.9,3.9,46.5,11.9,9.6,7.9,14.5,19.9,14.5,36.1v12.4c0,22.4-4.2,35.9-16.2,44.6-10.8,7.7-26.4,9.2-36.9,9.2-9.5,0-14.3.7-28,.5-16.5-.1-56.9.3-88-.1v-30c31.9,0,77.5.1,89.5.1,21.6,0,34.5.8,34.5-19.4v-12.1c0-6.2-1.8-10.9-5.4-14.2-3.6-3.3-10-4.9-19.2-4.9h-37.6C20.6,107.5,0,91.1,0,58.3v-13.9C0,28,6.8,16,20.5,8.3,34.2.6,34.8.3,64.5.3h66.4l-.1-.1h51.2l39.6,73.4L260.9.2h101.2c6.2,0,12,.1,17.5.4,13.9.7,25.4,2.2,34.6,4.6,12.7,3.4,22.1,9.2,28,17.5,5.9,8.2,8.9,19.6,8.9,34.3Z" style={{fill: '#f6f6f6'}}/>
                    <polygon points="573.8 150.1 573.8 187.7 463.7 187.7 463.7 123.1 501.5 123.1 501.5 150.1 573.8 150.1" style={{fill: '#f6f6f6'}}/>
                    <path d="M598.1,123.1l-23.9,64.5h44.5l21.6-64.5h-42.2ZM742.9,123.1h-44l21.6,64.5h45.7l-23.3-64.5ZM698.5,0h-54.9l-33.6,91h41.2l17.9-53.4h1.1l17.9,53.4h43.3L698.5,0Z" style={{fill: '#f6f6f6'}}/>
                    <polygon points="574.2 0 574.2 37.6 501.5 37.6 501.5 91 463.7 91 463.7 0 574.2 0" style={{fill: '#f6f6f6'}}/>
                    <polygon points="501.5 123.1 501.5 91 573.9 91 573.9 48.9 598.2 123.1 501.5 123.1" style={{fill: '#fece2f'}}/>
                    <polygon points="772 123.1 640.4 123.1 651.2 91 760.4 91 772 123.1" style={{fill: '#fece2f'}} />
                  </svg>
                </span>
            </a>
          </div>
        </div>
      </div>

      <div className="main-container">
        <div className="components-container">
          {ComponentsData.map((section, index) => (
            <div key={index}>
              {Object.entries(section).map(([key, value]) => (
                <div key={key} className="row-key-component">
                  <div className="y-d-flex y-gap-1 y-justify-content-between y-align-items-center row-key-menu">
                    <p className="key-item-component">{key}</p>
                    <img src={ArrowUp} className="icon-arrow-menu"></img>
                  </div>
                  {value.components.map((component, idx) => (
                    <div
                      key={`tile-${index}-${idx}`}
                      className="tile"
                      draggable
                      onDragStart={() => handleDragStart(component)}
                    >
                      <div className="row-drag-component">
                        <div className="drag-icon">
                          <svg fill="currentcolor" viewBox="0 0 24 24">
                            <path d="M10,4A2,2,0,1,1,8,2,2,2,0,0,1,10,4ZM8,10a2,2,0,1,0,2,2A2,2,0,0,0,8,10Zm0,8a2,2,0,1,0,2,2A2,2,0,0,0,8,18ZM16,6a2,2,0,1,0-2-2A2,2,0,0,0,16,6Zm0,8a2,2,0,1,0-2-2A2,2,0,0,0,16,14Zm0,8a2,2,0,1,0-2-2A2,2,0,0,0,16,22Z" />
                          </svg>
                        </div>
                        <p>{component.nome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="drag-and-drop-container y-relative">
          <div className="box-editor">
            <pre className="editor-text">{currentCodeHighlight}</pre>
          </div>
          <div className="y-container box-page" style={{backgroundColor: backgroundColorPage}}>
            {grid.map((row, index_row) => (
              <div className="y-row" key={index_row}>
                {row.map((cell, index_cell) => (
                  <div
                    className={`grid-cell ${editorMode ? "editable" : ""} ${
                      highlightsCell.find(
                        (e) => e.row === index_row && e.columns === index_cell
                      )
                        ? highlightsCell.find(
                            (e) =>
                              e.row === index_row && e.columns === index_cell
                          ).occupied
                          ? "occupied"
                          : "highlight"
                        : ""
                    } y-col-1`}
                    key={index_cell}
                    id={cell.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(index_row, index_cell);
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(index_row, index_cell)}
                  ></div>
                ))}
              </div>
            ))}
            {patchObj.map((overlay, index) => {
              const ComponentToRender = componentMap[overlay.component];
              return (
                <div
                  key={index}
                  className="overlay-container"
                  style={{
                    top: overlay.top,
                    left: overlay.left,
                    width: overlay.width,
                    height: overlay.height,
                  }}
                >
                  <div
                    className={`component-overlay ${
                      overlay.selected ? "selected" : ""
                    }`}
                    style={{
                      boxShadow: overlay.selected ? "inset 0 0 0 2px red" : "",
                    }}
                    onClick={() => handlePatchClick(index)}
                  >
                    <div
                      style={{ width: "100%", height: "100%" }}
                      className={`yuild-d-${overlay.props.layout.display} ${
                        overlay.props.layout.direction
                          ? `yuild-flex-dir-${overlay.props.layout.direction}`
                          : ""
                      } 
                        ${
                          overlay.props.layout["vertical-align"]
                            ? `yuild-vertical-align-${overlay.props.layout["vertical-align"]}`
                            : ""
                        } 
                        ${
                          overlay.props.layout["horizontal-align"]
                            ? `yuild-horizontal-align-${overlay.props.layout["horizontal-align"]}`
                            : ""
                        } 
                        `}
                    >
                      {ComponentToRender && (
                        <ComponentToRender {...overlay.props} />
                      )}
                    </div>

                    <div className="row-inner-tools y-d-flex y-gap-3 y-justify-content-between">
                      <div className="button-drag-component y-d-flex y-gap-1 y-align-items-center">
                        <div style={{width:'15px', height: 'auto'}}>
                          <img src={HandIcon}></img>
                        </div>
                        <span>DRAG</span>
                      </div>
                      <div className="button-drag-component y-d-flex y-gap-1 y-align-items-center">
                        <div style={{width:'15px', height: 'auto'}} className="y-d-flex " onClick={(e) => { e.stopPropagation(); handleDeletePatch(index)}}>
                          <img src={TrashIcon}></img>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="component-details-column" onClick={(event) => event.stopPropagation()}>
          <div className="comp-col-props">
            <div className="y-row">
              <div className="y-col-6">
                <button className={`btn-toggle ${toggleComponent ? 'selected':''}`} onClick={() => setToggleComponent(true)}>Component</button>
              </div>
              <div className="y-col-6">
                <button className={`btn-toggle ${!toggleComponent ? 'selected':''}`} onClick={() => setToggleComponent(false)}>Document</button>
              </div>
            </div>
            {
              !toggleComponent && 
              <div className="y-d-flex y-flex-direction-column y-gap-3 y-py-3">
                <div className="y-w-100 y-d-flex y-flex-direction-column">
                  <p className="props-comp-label">Name</p>
                  <input
                    spellCheck="false"
                    value={documentName}
                    name="label"
                    onChange={handleInputDocName}
                    className="input-props-comp"
                  />
                </div>
                <div>
                  <p className="props-comp-label">Background Color</p>
                  <ColorPicker colorProps={{ onChange: handleColorChange, value: backgroundColorPage }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div className="yuild-toggle-container">
                    <input
                      type="checkbox"
                      className="yuild-toggle-checkbox"
                      id="checkbox-css"
                      checked={cssIncluded}
                      onChange={(ev) => setCssIncluded(ev.target.checked)}
                    ></input>
                    <label className="yuild-toggle-switch" htmlFor="checkbox-css">
                      <span className="yuild-toggle-slider"></span>
                    </label>
                  </div>
                  <p className="y-m-0 props-comp-label">Include CSS</p>
                </div>
              </div>
            }
            <div>

            </div>

            <div className="y-d-flex y-justify-content-end y-py-2">
            {Object.keys(selectedProps).length > 0 && toggleComponent &&
              <>
                <div 
                  onClick={(e) => handleDeletePatchFromProps()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    className="trash-icon"
                  >
                    <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                  </svg>
                </div>
              </>
            }
            </div>
            {Object.keys(selectedProps).length > 0 && toggleComponent && (
              <>
              <p className="props-comp-topic">Props</p>
                {selectedProps.theme && (
                  <div className="row-comp-props">
                    <p className="props-comp-label">Theme</p>
                    <select
                      name="theme"
                      id="theme-select"
                      value={selectedProps.theme}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    >
                      <option value="sap">sap</option>
                      <option value="material">yuild</option>
                    </select>
                  </div>
                )}
                {selectedProps.label !== null &&
                  selectedProps.label !== undefined && (
                    <div className="row-comp-props y-w-100 y-d-flex y-flex-direction-column">
                      <p className="props-comp-label">Label</p>
                      <input
                        value={selectedProps.label}
                        name="label"
                        onChange={handleInputChangeProps}
                        className="input-props-comp"
                      />
                    </div>
                  )}
                {selectedProps.placeholder !== null &&
                  selectedProps.placeholder !== undefined && (
                    <div className="row-comp-props y-w-100 y-d-flex y-flex-direction-column">
                      <p className="props-comp-label">Placeholder</p>
                      <input
                        value={selectedProps.placeholder}
                        name="placeholder"
                        onChange={handleInputChangeProps}
                        className="input-props-comp"
                      />
                    </div>
                  )}

                {selectedProps.variant && (
                  <div className="row-comp-props">
                    <p className="props-comp-label">Variant</p>
                    <select
                      name="variant"
                      value={selectedProps.variant || "default"}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    >
                      <option value="default">default</option>
                      <option value="disabled">disabled</option>
                      <option value="readOnly">readOnly</option>
                      <option value="error">error</option>
                      <option value="success">success</option>
                      <option value="warning">warning</option>
                      <option value="information">information</option>
                    </select>
                  </div>
                )}

                {selectedProps.disabled !== null &&
                  selectedProps.disabled !== undefined && (
                    <div className="row-comp-props">
                      <p className="props-comp-label">Disabled</p>
                      <input
                        type="checkbox"
                        checked={selectedProps.disabled}
                        name="disabled"
                        onChange={handleInputChangeProps}
                        className="checkbox-props-comp"
                      />
                    </div>
                  )}

                {selectedProps.required !== null &&
                  selectedProps.required !== undefined && (
                    <div className="row-comp-props">
                      <p className="props-comp-label">Required</p>
                      <input
                        type="checkbox"
                        checked={selectedProps.required}
                        name="required"
                        onChange={handleInputChangeProps}
                        className="checkbox-props-comp"
                      />
                    </div>
                  )}

                {selectedProps.readOnly !== null &&
                  selectedProps.readOnly !== undefined && (
                    <div className="row-comp-props">
                      <p className="props-comp-label">Read only</p>
                      <input
                        type="checkbox"
                        checked={selectedProps.readOnly}
                        name="readOnly"
                        onChange={handleInputChangeProps}
                        className="checkbox-props-comp"
                      />
                    </div>
                  )}

                <p className="props-comp-topic" style={{ marginTop: "1rem" }}>
                  Layout
                </p>
                <div className="row-comp-props">
                  <div>
                    <p className="props-comp-label">Display</p>
                    <select
                      name="layout.display"
                      value={selectedProps.layout?.display || "block"}
                      onChange={handleInputChangeProps}
                      className="input-props-comp"
                    >
                      <option value="block">block</option>
                      <option value="flex">flex</option>
                      <option value="inline">inline</option>
                      <option value="grid">grid</option>
                    </select>
                  </div>
                  {selectedProps.layout?.display === "flex" && (
                    <>
                      <div>
                        <p className="props-comp-label">Direction</p>
                        <select
                          name="layout.direction"
                          value={selectedProps.layout?.direction || "row"}
                          onChange={handleInputChangeProps}
                          className="input-props-comp"
                        >
                          <option value="row">row</option>
                          <option value="row-reverse">row-reverse</option>
                          <option value="column">column</option>
                          <option value="column-reverse">column-reverse</option>
                        </select>
                      </div>
                      <div>
                        <p className="props-comp-label">Vertical Align</p>
                        <select
                          name="layout.vertical-align"
                          value={
                            selectedProps.layout?.["vertical-align"] || "center"
                          }
                          onChange={handleInputChangeProps}
                          className="input-props-comp"
                        >
                          <option value="center">center</option>
                          <option value="start">start</option>
                          <option value="end">end</option>
                          <option value="stretch">stretch</option>
                        </select>
                      </div>
                      <div>
                        <p className="props-comp-label">Horizontal Align</p>
                        <select
                          name="layout.horizontal-align"
                          value={
                            selectedProps.layout?.["horizontal-align"] ||
                            "center"
                          }
                          onChange={handleInputChangeProps}
                          className="input-props-comp"
                        >
                          <option value="center">center</option>
                          <option value="start">start</option>
                          <option value="end">end</option>
                          <option value="space-between">space-between</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <p className="props-comp-topic" style={{ marginTop: "1rem" }}>
                  Spacing
                </p>
                <div className="row-comp-props">
                  <div>
                    <p className="props-comp-label">Margin</p>
                    <p className="props-comp-label">All</p>
                    <input
                      value={selectedProps.spacing?.margin.all}
                      name="spacing.margin.all"
                      onChange={handleInputChangeProps}
                      placeholder="0px"
                      className="input-props-comp"
                    />
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Top</p>
                        <input
                          value={selectedProps.spacing?.margin.top}
                          name="spacing.margin.top"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Left</p>
                        <input
                          value={selectedProps.spacing?.margin.left}
                          name="spacing.margin.left"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Right</p>
                        <input
                          value={selectedProps.spacing?.margin.right}
                          name="spacing.margin.right"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Bottom</p>
                        <input
                          value={selectedProps.spacing?.margin.bottom}
                          name="spacing.margin.bottom"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="props-comp-label">Padding</p>
                    <p className="props-comp-label">All</p>
                    <input
                      value={selectedProps.spacing?.padding.all}
                      name="spacing.padding.all"
                      onChange={handleInputChangeProps}
                      placeholder="0px"
                      className="input-props-comp"
                    />
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Top</p>
                        <input
                          value={selectedProps.spacing?.padding.top}
                          name="spacing.padding.top"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Left</p>
                        <input
                          value={selectedProps.spacing?.padding.left}
                          name="spacing.padding.left"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Right</p>
                        <input
                          value={selectedProps.spacing?.padding.right}
                          name="spacing.padding.right"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <p className="props-comp-label">Bottom</p>
                        <input
                          value={selectedProps.spacing?.padding.bottom}
                          name="spacing.padding.bottom"
                          onChange={handleInputChangeProps}
                          placeholder="0px"
                          className="box-spacing-props input-props-comp"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
