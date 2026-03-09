async function buscarClima(){

let cidade = document.getElementById("cidade").value

let resposta = await fetch(`https://wttr.in/${cidade}?format=j1`)

let dados = await resposta.json()

let temperatura = dados.current_condition[0].temp_C

let clima = dados.current_condition[0].weatherDesc[0].value

let resultado = document.getElementById("resultado")

resultado.innerHTML = `
<h2>${cidade}</h2>
<p>Temperatura: ${temperatura}°C</p>
<p>Clima: ${clima}</p>
`

}