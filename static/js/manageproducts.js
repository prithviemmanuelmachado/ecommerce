var container = document.getElementById('cartcontainer');
var addnewproducts = document.getElementById('addnewproducts');
var edit = document.getElementsByClassName('edit');
var deleteprod = document.getElementsByClassName('deleteprod');
var close;
var product = "";

if(edit)
{
    for(i=0; i<edit.length; i++)
        edit[i].addEventListener("click", getProduct);
}
if(deleteprod)
{
    for(i=0; i<deleteprod.length; i++)
        deleteprod[i].addEventListener("click", removeProduct);
}
addnewproducts.addEventListener("click", displayProductForm);

function getProduct(event)
{
    var id = event.target.parentNode.parentNode.parentNode.id;
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST','/getDescription');
    xhttp.setRequestHeader('Content-type', 'application/json');
    xhttp.addEventListener('load', displayDetails);
    var obj = {id : id};
    xhttp.send(JSON.stringify(obj));
}

function displayDetails(response)
{
    product = JSON.parse(response.target.responseText);
    console.log(product);
    addnewproducts.click();
}


function displayProductForm(event)
{
    var modal = document.createElement('div');
    modal.setAttribute('class', 'modal');

    var content = document.createElement('div');
    content.setAttribute('class', 'content');
    
    var title = document.createElement('h1');
    title.innerText = "ENTER NEW PRODUCT DETAILS"; 
    
    close = document.createElement('button');
    close.addEventListener("click", closeModal);
    close.setAttribute('class', 'closeButton');
    close.innerText="X"
   

    var table = document.createElement('table');
    var row1 = document.createElement('tr');
    var row2 = document.createElement('tr');
    var row3 = document.createElement('tr');
    var row4 = document.createElement('tr');
    var row5 = document.createElement('tr');
    var row6 = document.createElement('tr');

    var tdTitleLeft = document.createElement('td');
    tdTitleLeft.innerText = "TITLE";
    var tdDescLeft = document.createElement('td');
    tdDescLeft.innerText = "DESCRIPTION";
    var tdStockLeft = document.createElement('td');
    tdStockLeft.innerText = "STOCK";
    var tdPriceLeft = document.createElement('td');
    tdPriceLeft.innerText = "PRICE";
    var tdImageLeft = document.createElement('td');
    tdImageLeft.innerText = "IMAGE";

    var tdTitleRight = document.createElement('td');
    var entertitle = document.createElement('input');
    entertitle.setAttribute('type', 'text');
    entertitle.setAttribute('class', 'input');
    entertitle.setAttribute('id', 'entertitle');
    if(product)
        entertitle.value=product.title;
    tdTitleRight.appendChild(entertitle);

    var tdDescRight = document.createElement('td');
    var desc = document.createElement('input');
    desc.setAttribute('type', 'text');
    desc.setAttribute('class', 'input');
    desc.setAttribute('id', 'desc');
    if(product)
        desc.value=product.description;
    tdDescRight.appendChild(desc);
    
    var tdStockRight = document.createElement('td');
    var stock = document.createElement('input');
    stock.setAttribute('type', 'text');
    stock.setAttribute('class', 'input');
    stock.setAttribute('id', 'stockinput');
    if(product)
        stock.value=product.stock;
    tdStockRight.appendChild(stock);
    
    var tdPriceRight = document.createElement('td');
    var price = document.createElement('input');
    price.setAttribute('type', 'text');
    price.setAttribute('class', 'input');
    price.setAttribute('id', 'price');
    if(product)
        price.value=product.price;
    tdPriceRight.appendChild(price);
    
    var tdImageRight = document.createElement('td');
    var image = document.createElement('input');
    image.setAttribute('type', 'file');
    image.setAttribute('id', 'image');
    if(product)
    {
        image.setAttribute('value', product.image);
    }
        
    tdImageRight.appendChild(image);
    

    var tdSubmit = document.createElement('td');
    var submit = document.createElement('button');
    submit.innerText = "SUBMIT";
    submit.setAttribute("id", "addnewproducts");
    submit.addEventListener("click", sendProduct);
    tdSubmit.setAttribute('colspan', '2');
    tdSubmit.appendChild(submit);

    row1.appendChild(tdTitleLeft);
    row2.appendChild(tdDescLeft);
    row3.appendChild(tdStockLeft);
    row4.appendChild(tdPriceLeft);
    row5.appendChild(tdImageLeft);
    row6.appendChild(tdSubmit);

    row1.appendChild(tdTitleRight);
    row2.appendChild(tdDescRight);
    row3.appendChild(tdStockRight);
    row4.appendChild(tdPriceRight);
    row5.appendChild(tdImageRight);

    table.appendChild(row1);
    table.appendChild(row2);
    table.appendChild(row3);
    table.appendChild(row4);
    table.appendChild(row5);
    table.appendChild(row6);
    
    content.appendChild(title);
    content.appendChild(close);
    content.appendChild(table);

    modal.appendChild(content);
    container.appendChild(modal); 
        
}

function closeModal(event)
{
    var parent = event.target.parentNode.parentNode.parentNode;
    var child = event.target.parentNode.parentNode;
    product = "";
    parent.removeChild(child);
}

function removeProduct(event)
{
    var card = event.target.parentNode.parentNode.parentNode;
    var id = card.id
    
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST','/removeproduct');
    xhttp.setRequestHeader('Content-type', 'application/json');
    xhttp.addEventListener('load', ()=>{
        container.removeChild(card);
    });
    var obj = {id : id};
    xhttp.send(JSON.stringify(obj));
    
}

function sendProduct(event)
{
    var entertitle = document.getElementById('entertitle').value;
    var desc = document.getElementById('desc').value;
    var stock = document.getElementById('stockinput').value;
    var price = document.getElementById('price').value;
    var image = document.getElementById('image').files;
    if(product)
    {
        console.log("existing");
        
        if(entertitle == product.title && stock == product.stock && price == product.price && image.length == 0 && desc == product.description)
        {
            alert("NOTHING HAS CHANGED");
            close.click();
        }
        else
        {
            var obj = new FormData();
            obj.append('id', product.id);
            obj.append('title', entertitle);
            obj.append('desc', desc);
            obj.append('stock',stock);
            obj.append('price', price);
            obj.append('image', image[0]);

            var xhttp = new XMLHttpRequest();
            xhttp.open('POST','/updateproduct');
            xhttp.addEventListener('load', ()=>{
                close.click();
                window.location.reload();
            });
            xhttp.send(obj);
        }
    }
    else
    {
        console.log("new");
        if(entertitle == "" || stock == "" || price == "" || image.length == 0)
            alert("PLEASE FILL ALL INPUTS");
        else
        {
            console.log(image[0]);
            var obj = new FormData();
            obj.append('title', entertitle);
            obj.append('desc', desc);
            obj.append('stock',stock);
            obj.append('price', price);
            obj.append('image', image[0]);

            var xhttp = new XMLHttpRequest();
            xhttp.open('POST','/addproduct');
            xhttp.addEventListener('load', ()=>{
                close.click();
                window.location.reload();
            });
            xhttp.send(obj);
        }

    }
    
}