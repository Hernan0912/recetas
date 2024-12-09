function iniciarApp(){

    const resultado = document.querySelector("#resultado")

    const selectCategorias = document.querySelector("#categorias")
    
    //Con un select siempre vamos a usar el evento change
    if(selectCategorias){
        selectCategorias.addEventListener("change", seleccionarCategorias)
        obtenerCategorias()
    }

    const favoritosDiv = document.querySelector(".favoritos")
    if(favoritosDiv){
        obtenerFavoritos()
    }

    //Modal es una instancia de bootstrap
    const modal = new bootstrap.Modal("#modal",{})

    //Funcion que toma los datos de la api de categorías
    function obtenerCategorias(){
        const url = "https://www.themealdb.com/api/json/v1/1/categories.php"

        //Fetch toma la api indicada.
        fetch(url)

        //el primer .then hace referencia a la respuesta que recibió del fetch.
            .then(respuesta => respuesta.json())

        // segundo .then hace referencia a la respuesta que recibió del primer .then
            .then(resultado => mostrarCategorias(resultado.categories))
    }

    function mostrarCategorias(categorias = []){
        categorias.forEach(categoria => {
            const {strCategory} = categoria
            const option = document.createElement("option")

            //contenido que vamos a enviarle a la api
            option.value = strCategory

            //contenido visible para el usuario
            option.textContent = strCategory
            selectCategorias.appendChild(option)
        })
    }

    function seleccionarCategorias(e){
        const categoria = e.target.value

        /*La api toma el valor c, y lo toma como referencia con la comida elegida, 
        ese dato lo debemos hacer dinámico para que tome los valores que seleccione
        el cliente*/
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`
        fetch (url)
        .then(respuesta => respuesta.json())
        .then(resultado => mostrarRecetas(resultado.meals))
    }

    function mostrarRecetas(recetas = []){

        limpiarHtml(resultado)

        const heading = document.createElement("H2")
        heading.classList.add("text-center", "text-black","my-5")
        heading.textContent = recetas.length ? "Resultados" : "No hay resultados"
        resultado.appendChild(heading)

        recetas.forEach( receta => {
            const {idMeal, strMeal, strMealThumb} = receta

            const recetaContenedor = document.createElement("DIV")
            recetaContenedor.classList.add("col-md-4")

            const recetaCard = document.createElement("DIV")
            recetaCard.classList.add("card", "mb-4")

            const recetaImagen = document.createElement("IMG")
            recetaImagen.classList.add("card-img-top")

            //Texto alternativo
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`

            //Imagen
            recetaImagen.src = strMealThumb ?? receta.img

            const recetaCardBody = document.createElement("DIV")
            recetaCardBody.classList.add("card-body")

            const recetaHeading = document.createElement("H3")
            recetaHeading.classList.add("card-tittle", "mb-3")
            recetaHeading.textContent = strMeal ?? receta.titulo

            const recetaButton = document.createElement("BUTTON")
            recetaButton.classList.add("btn", "btn-danger", "w-100")
            recetaButton.textContent = "Ver Receta"

            // recetaButton.dataset.bsTarget = "#modal"
            // recetaButton.dataset.bsToggle = "modal"

            recetaButton.onclick = function(){
                seleccionarReceta(idMeal ?? receta.id)
            }

            //Inyectar en el código HTML
            recetaCardBody.appendChild(recetaHeading)
            recetaCardBody.appendChild(recetaButton)

            recetaCard.appendChild(recetaImagen)
            recetaCard.appendChild(recetaCardBody)

            recetaContenedor.appendChild(recetaCard)

            resultado.appendChild(recetaContenedor)
        })
    }

    function seleccionarReceta(id){
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        fetch(url)
        .then(respuesta => respuesta.json())
        .then (resultado => mostrarRecetaModal(resultado.meals[0]))
    }

    function mostrarRecetaModal(receta){

        const {idMeal, strInstructions, strMeal, strMealThumb} = receta

        //Añadir contenido al modal
        const modalTitle = document.querySelector(".modal .modal-title")
        const modalBody = document.querySelector(".modal .modal-body")

        modalTitle.textContent = strMeal
        modalBody.innerHTML= `
            <img class="img-fluid" src = "${strMealThumb}" alt="receta ${strMeal}"/>
            <h3 class="my-3"> Instrucciones <h3/>
            <p>${strInstructions}</p>
            <h3 class="my-3"> Ingredientes y Cantidades <h3/>
        `

        const listGroup = document.createElement("UL")
        listGroup.classList.add("list-group")

        //Mostrar cantidades e ingredientes
        for(let i = 1; i<=20; i++){
            if(receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`]
                const cantidad = receta[`strMeasure${i}`]

                const ingredienteLi = document.createElement("LI")
                
                //Le agrego una clase de bootstrap
                ingredienteLi.classList.add("list-group-item")
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}` 

                listGroup.appendChild(ingredienteLi)
            }
        }

        modalBody.appendChild(listGroup)

        const modalFooter = document.querySelector(".modal-footer")
        limpiarHtml(modalFooter)

        //Botones de cerrar y favorito
        const btnFavorito = document.createElement("BUTTON")
        btnFavorito.classList.add("btn", "btn-danger", "col")
        btnFavorito.textContent = existeStorage(idMeal) ? "Eliminar Favorito" : "Guardar favorito"

        //local storage
        btnFavorito.onclick = function(){

            if(existeStorage(idMeal)){
                eliminarFavorito(idMeal)
                btnFavorito.textContent = "Guardar Favorito"
                mostrarToast("Eliminado correctamente")
                return
            }

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb
            })
            btnFavorito.textContent = "Eliminar Favorito"
            mostrarToast("Agregado correctamente")
        }


        const btnCerrarModal = document.createElement("BUTTON")
        btnCerrarModal.classList.add("btn", "btn-secondary", "col")
        btnCerrarModal.textContent = "Cerrar"
        btnCerrarModal.onclick = function(){

            //Ya habíamos instanciado el modal en la linea 8, hide es un método de bootstrap.Modal
            modal.hide()

        }

        modalFooter.appendChild(btnFavorito)
        modalFooter.appendChild(btnCerrarModal)

        //muestra el modal, show es un método de bootstrap.Modal
        modal.show()
    }

    function agregarFavorito(receta){
        //Recupera el valor asociado a la clave "favoritos" en local storage
        //En caso de que no exista nada en favoritos, le enviamos un array vacío
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? []
        localStorage.setItem("favoritos",JSON.stringify([...favoritos, receta]))
    }

    function eliminarFavorito(id){
        
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? []
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id != id)
        localStorage.setItem("favoritos", JSON.stringify(nuevosFavoritos))
    }

    function existeStorage(id){
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? []
        return favoritos.some(favorito => favorito.id == id )
    }

    function mostrarToast(mensaje){
        const toastDiv = document.querySelector("#toast")
        const toastBody = document.querySelector(".toast-body")
        const toast = new bootstrap.Toast(toastDiv)
        toastBody.textContent = mensaje
        toast.show()
    }

    function obtenerFavoritos(){
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) ?? []
        if(favoritos.length){
            mostrarRecetas(favoritos)
            return
        }

        const noFavoritos = document.createElement("P")
        noFavoritos.textContent= "No hay favoritos aún"
        noFavoritos.classList.add("fs-4","text-center","font-bold","mt-5")
        resultado.appendChild(noFavoritos)
    }

    function limpiarHtml(selector){
        while(selector.firstChild){
            selector.removeChild(selector.firstChild)
        }
    }


}

document.addEventListener("DOMContentLoaded", iniciarApp)