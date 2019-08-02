function onload() {
    const state = getData('personnummer', {});

    document.querySelector('#date').value = state.date || '1937-02-21';
    document.querySelector('#gender').value = state.gender || 'm';

    const savedEntries = new Set(getData('entries', []));

    refresh(savedEntries);

    loadPeople(savedEntries);
}

function refresh(savedEntries) {
    const date = document.querySelector('#date').value;
    const gender = document.querySelector('#gender').value;

    if (!date || !gender) return;

    setData('personnummer', { date, gender });

    const output = document.querySelector('#output');

    output.textContent = '';

    const children = pipe(
        generate(date, gender),
        skip(Math.random() * 1000),
        take(20),
        map(value => ({ value, checked: savedEntries.has(value) })),
        map(entry)
    );

    for (const child of children) {
        output.appendChild(child);
    }
}

function loadPeople(savedEntries) {
    const wrapper = document.querySelector('#wrapper');
    const savedNames = getData('names', []);
    for (const { date, gender, name, offset = 0 } of savedNames) {
        wrapper.appendChild(
            e('div', { className: 'person' },
                e('h3', null,
                    name,
                    e('button', { className: 'btn-delete', onclick: deletePerson(name) },
                        '-'
                    )
                ),
                e('div', { className: 'output' },
                    ...pipe(
                        generate(date, gender),
                        skip(offset),
                        take(20),
                        map(value => ({ value, checked: savedEntries.has(value) })),
                        map(entry)
                    )
                ),
                e('div', { className: 'entry' },
                    e('button', { className: 'btn-more', onclick: loadMore(name, -20) },
                        '\u21e0'
                    ),
                    e('button', { className: 'btn-more', onclick: loadMore(name, +20) },
                        '\u21e2'
                    )
                )
            )
        );
    }
}

function entry({ value, checked }) {
    return e('div', { className: 'entry' },
        e('input', { checked, type: 'checkbox', onchange: markEntry(value) }),
        e('input', { value, readOnly: true })
    );
}

function markEntry(value) {
    return e => {
        const savedEntries = getData('entries', []);
        if (e.target.checked) {
            setData('entries', [...savedEntries, value]);
        } else {
            setData('entries', savedEntries.filter(v => v != value));
        }
    }
}

function deletePerson(name) {
    return e => {
        const savedNames = getData('names', []);
        setData('names', savedNames.filter(p => p.name != name));
        document.location.reload();
    }
}

function loadMore(name, delta) {
    return e => {
        const savedNames = getData('names', []);
        setData('names', savedNames.map(p => p.name == name ? { ...p, offset: p.offset + delta } : p));
        document.location.reload();
    }
}

function savePerson() {
    const name = document.querySelector("#name").value;
    const date = document.querySelector('#date').value;
    const gender = document.querySelector('#gender').value;

    if (!date || !gender || !name) return;

    const savedNames = getData('names', []);
    savedNames.push({ name, date, gender, offset: 0 });
    setData('names', savedNames);
    document.location.reload();
}

function* generate(date, gender) {
    const [year, month, day] = date.split('-');
    const birthdate = `${day}${month}${year.substr(2)}`;

    for (const val of getRangeOld(year)) {
        if (gender === 'f' ^ val % 2 === 0) continue;
        const result = `${birthdate}${pad(val, 3)}`;
        const digits = result.split('');
        const k1 = checksum1(...digits);
        if (k1 === 10) continue;
        const k2 = checksum2(...digits, k1);
        if (k2 === 10) continue;
        yield `${result}${k1}${k2}`;
    }
}

function* getRangeOld(year) {
    if (year < 1900) {
        yield* range(500, 750);
    } else {
        yield* range(0, 500);
    }
}
function* getRangeNew(year) {
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

function* range(from, to) {
    for (let i = 0; i < Infinity; i++) {
        yield from + (i % (to - from));
    }
}

function checksum1(d1, d2, m1, m2, y1, y2, i1, i2, i3) {
    const remainder = (3 * d1 + 7 * d2 + 6 * m1 + 1 * m2 + 8 * y1 + 9 * y2 + 4 * i1 + 5 * i2 + 2 * i3) % 11;
    return remainder === 0
        ? 0
        : 11 - remainder;
}

function checksum2(d1, d2, m1, m2, y1, y2, i1, i2, i3, k1) {
    const remainder = (5 * d1 + 4 * d2 + 3 * m1 + 2 * m2 + 7 * y1 + 6 * y2 + 5 * i1 + 4 * i2 + 3 * i3 + 2 * k1) % 11;
    return remainder === 0
        ? 0
        : 11 - remainder;
}

function pad(v, size) {
    v = v.toString(10);
    while (v.length < size) {
        v = '0' + v;
    }
    return v;
}

function take(count) {
    return function* (iterator) {
        for (let i = 0; i < count; i++) {
            const { value, done } = iterator.next();
            if (done) return;
            yield value;
        }
    }
}

function skip(count) {
    return function* (iterator) {
        for (let i = 0; i < Infinity; i++) {
            const { value, done } = iterator.next();
            if (done) return;
            if (i >= count) {
                yield value;
            }
        }
    }
}

function map(map, ...params) {
    return function* (iterator) {
        for (const value of iterator) {
            yield map(value, ...params);
        }
    }
}

function pipe(value, ...steps) {
    for (const step of steps) {
        value = step(value);
    }
    return value;
}

function getData(key, fallback) {
    return JSON.parse(localStorage.getItem(key) || 'false') || fallback;
}

function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function e(type, props, ...children) {
    const elm = document.createElement(type);
    if (props) {
        for (const [key, value] of Object.entries(props)) {
            elm[key] = value;
        }
    }
    for (const child of children) {
        if (typeof (child) == 'string') {
            elm.appendChild(document.createTextNode(child));
        } else {
            elm.appendChild(child);
        }
    }
    return elm;
}