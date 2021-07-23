var view = document.getElementsByClassName('view');
var addQuantity = document.getElementsByClassName('addQuandity');
var decQuandity = document.getElementsByClassName('decQuandity');
var container = document.getElementById('cartcontainer');

if(view)
{
    for(i=0; i<view.length; i++)
        view[i].addEventListener("click", showDesc);
}

if(addQuantity)
{
    for(i=0; i<addQuantity.length; i++)
        addQuantity[i].addEventListener("click", addQuantityfunc);
}

if(decQuandity)
{
    for(i=0; i<decQuandity.length; i++)
        decQuandity[i].addEventListener("click", decQuantityfunc);
}


function showDesc(event)
{
    var id = (event.target.parentNode.id);
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST','/getDescription');
    xhttp.addEventListener('load', displayModal);
    xhttp.setRequestHeader('Content-type', 'application/json');
    var obj = {
        id : id
    };
    xhttp.send(JSON.stringify(obj));
}

function addQuantityfunc(event)
{
    var id = (event.target.parentNode.id);
    var quant = event.target.parentNode.querySelector("#quant");
    var stock = parseInt(quant.className);

    if(parseInt(quant.innerText)<stock)
        quant.innerText = parseInt(quant.innerText)+1;
    
}

function decQuantityfunc(event)
{
    var cartcard = event.target.parentNode.parentNode.parentNode;
    var quant = event.target.parentNode.querySelector('#quant');
    var id = cartcard.id;
    

    if(parseInt(quant.innerText) == 1)
    {
        var xhttp = new XMLHttpRequest();
        xhttp.open('POST','/removefromcart');
        xhttp.addEventListener('load', ()=>{
            cartcard.parentNode.removeChild(cartcard);
        });
        xhttp.setRequestHeader('Content-type', 'application/json');
        console.log(id);
        var obj = {
            id : id
        };
        xhttp.send(JSON.stringify(obj));

    }
    else if(parseInt(quant.innerText)>1)
        quant.innerText = parseInt(quant.innerText)-1;
     
    
}

function displayModal(response)
{
    var product = JSON.parse(response.target.responseText);
    
    console.log(product);

    var modal = document.createElement('div');
    modal.setAttribute('class', 'modal');

    var content = document.createElement('div');
    content.setAttribute('class', 'content');
    content.setAttribute('id', product.id);
    
    var title = document.createElement('h1');
    title.innerHTML = product.title+"<br>";    

    var close = document.createElement('button');
    close.addEventListener("click", closeModal);
    close.setAttribute('class', 'closeButton');
    close.innerText="X"
        

    var image = document.createElement('img');
    image.src = "/images/"+product.image;
    image.setAttribute('class', 'modalImage');

    var desc = document.createElement('div');
    desc.innerHTML = "DESCRIPTION : <br>"+product.description;
    desc.setAttribute('class', 'desc');

    var price = document.createElement('div');
    price.innerHTML = "<br>PRICE : &#8377;"+product.price;
    price.setAttribute('class', 'desc');

    var stock = document.createElement('div');
    stock.innerHTML = "<br>STOCK : "+product.stock;
    stock.setAttribute('class', 'desc');


    content.appendChild(close);
    content.appendChild(title);
    content.appendChild(image);
    content.appendChild(desc);
    content.appendChild(stock);
    content.appendChild(price);
    modal.appendChild(content);
    container.appendChild(modal);

}

function closeModal(event)
{
    var parent = event.target.parentNode.parentNode.parentNode;
    var child = event.target.parentNode.parentNode;
    parent.removeChild(child);
}