function refresh(){
    const date = document.querySelector('#date').value;
    const gender = document.querySelector('#gender').value;    

    if(!date || !gender) return;

    const output = document.querySelector('#output');

    const numbers = generate(date, gender);
    output.textContent = '';
    for(let i=0; i<10; i++){
        const value = numbers.next().value;
        output.textContent += value+'\n';
        console.log(value);
    }
}


function* generate(date, gender){
    const [year, month, day] = date.split('-');
    const birthdate = `${day}${month}${year.substr(2)}`;

    for (const val of getRangeOld(year)) {
        if (gender === 'f' ^ val%2 === 0) continue;
        const result = `${birthdate}${pad(val, 3)}`;
        const digits = result.split('');
        const k1 = checksum1(...digits);
        if(k1 === 10) continue;
        const k2 = checksum2(...digits, k1);
        if(k2 === 10) continue;
        yield `${result}${k1}${k2}`;
    }
}

function* getRangeOld(year){
    if (year < 1900) {
        yield* range(500, 750);
    } else {
        yield* range(0, 500);
    }
}
function* getRangeNew(year){
    if (year < 1900) {
        yield* range(500, 750);
    } else if (year < 1940) {
        yield* range(0, 500);
    } else if (year < 2000) {
        yield* range(0, 500);
        yield* range(900, 1000);
    } else {
        yield* range(500, 1000);
    }
}

function* range(from, to){
    for(let i=from; i<to; i++){
        yield i;
    }
}

function checksum1(d1, d2, m1, m2, y1, y2, i1, i2, i3) {
    const remainder = (3*d1 + 7*d2 + 6*m1 + 1*m2 + 8*y1 + 9*y2 + 4*i1 + 5*i2 + 2*i3) % 11;
    return remainder === 0
        ? 0
        : 11 - remainder;
}

function checksum2(d1, d2, m1, m2, y1, y2, i1, i2, i3, k1) {
    const remainder = (5*d1 + 4*d2 + 3*m1 + 2*m2 + 7*y1 + 6*y2 + 5*i1 + 4*i2 + 3*i3 + 2*k1) % 11;
    return remainder === 0
        ? 0
        : 11 - remainder;
}

function pad(v, size) {
    v = v.toString(10);
    while(v.length < size){
        v = '0'+v;
    }
    return v;
}
