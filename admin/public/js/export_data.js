export_data = {
  export  : (data, columns, filename) => {
    var separator = ',',
        dataSource = {
          data: data,
          columns: columns
        };

    var content  = createExportHeader(dataSource, separator);
        content += createExportRows(dataSource, separator);
      
    //an anchor html element on the page (or create dynamically one)
    //to use its download attribute to set filename
    var a       = document.getElementById('csv');
    a.download  = filename + '.csv';
    a.href      = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(content);
    a.click();
  }
}

function createExportHeader(dataSource, separator) {
  var headerRow = "",
      columns = dataSource.columns,
      newLine = "\r\n";
       
  for (var i=0; i < columns.length; i++) {
      headerRow += (i > 0 ? separator : '') + columns[i].displayName;
  }
  return headerRow + newLine;
}

function createExportRows(dataSource, separator) {
  var content = "",
      columns = dataSource.columns,
      data = dataSource.data,
      newLine = "\r\n",
      dataField;

  for(var j=0; j < data.length; j++) {
      for (var i=0; i < columns.length; i++) {
          dataField = columns[i].dataField;
          content += (i > 0 ? separator : '') + data[j][dataField];
      }
      content += newLine;
  }
  return content;
}