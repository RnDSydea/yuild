import React, { useState } from 'react';
import './table.scss';
import ArrowUp from '../../assets/arrow-up-solid.svg'
import ArrowDown from '../../assets/arrow-down-solid.svg'

const Table = ({ theme = 'sap', columns, data }) => {
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'ascending' });

  const tableClass = `${theme}-table`;
  const tableContainerClass = `${theme}-table-container`;
  const headerClass = `${theme}-table-header`;
  const rowClass = `${theme}-table-row`;
  const cellClass = `${theme}-table-cell`;

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  return (
    <div className={tableContainerClass}>
      
      <table className={tableClass}>
        <thead className={headerClass}>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={cellClass} onClick={() => requestSort(col.accessor)} >
                <div style={{display:"flex", gap:"30px", flexDirection: "row"}}>
                {col.header}
                {sortConfig.key === col.accessor ? (
                  sortConfig.direction === 'ascending' ? (
                    <img src={ArrowUp} alt="Ascending" className="sort-icon" />
                  ) : (
                    <img src={ArrowDown} alt="Descending" className="sort-icon" />
                  )
                ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowClass}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={cellClass}>
                  {row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
