import { getFuelStationsAsync, getRouteAsync } from './hereClient'

export const getFuelStationsAlongTwoPointsRouteAsync = (id, code, departCoords, destCoords) => {
  let shape, stations, dieselStations
  return getFuelStationsAsync(id, code, departCoords, destCoords)
    .then(resj => {
      shape = Array.prototype.concat(...resj.response.route[0].leg[0].link.map(l => pairs(l.shape)))
      const geometries = resj.response.route[0].searchResult.geometries
      if (geometries.length > 0) {
        stations = extractStationsFromGeometries(geometries)
        dieselStations = findDieselStationsInVisitOrder(stations, resj.response.route[0].leg[0].link)
        return Promise.all(
          Array.prototype.concat(
            getRouteAsync(id, code, departCoords, dieselStations[0].latlng),
            dieselStations.slice(0, dieselStations.length - 1).map((ds, i) =>
              getRouteAsync(id, code, ds.latlng, dieselStations[i + 1].latlng)
            ),
            getRouteAsync(id, code, dieselStations[dieselStations.length - 1].latlng, destCoords)
          )
        )
      } else {
        stations = []
        return getRouteAsync(id, code, departCoords, destCoords)
      }
    })
    .then(resjs => {
      let departPath, departDistance
      if (resjs instanceof Array) {
        [departPath, departDistance] = getPathAndDistanceFromRes(resjs.shift())

        for (let i = 0; i < resjs.length; i++) {
          const [path, distance] = getPathAndDistanceFromRes(resjs[i])
          dieselStations[i].pathToNextPoint = path
          dieselStations[i].distanceToNextPoint = distance
        }
      } else {
        [departPath, departDistance] = getPathAndDistanceFromRes(resjs)
      }

      return {
        fuelStations: {
          stations, // stations and dieselStations share the same station objects
          departCoords,
          departDistance,
          departPath,
          destCoords
        },
        originalRouteShape: shape
      }
    })
}

export const getDieselStationsAlongRouteAsync = (id, code, ...waypoints) => {
  return Promise.all(
    waypoints
      .slice(0, waypoints.length - 1)
      .map((wp, i) => getFuelStationsAlongTwoPointsRouteAsync(id, code, wp, waypoints[i + 1]))
  ).then(stationInfos => {
    const [WP, ST] = ['waypoint', 'fuelStation']
    const stations = []
    for (const info of stationInfos) {
      stations.push({ type: WP, name: WP, coords: info.fuelStations.departCoords, distanceToNextPoint: info.fuelStations.departDistance })
      const dieselStations = info.fuelStations.stations.filter(st => st.isDiesel)
      dieselStations.sort((a, b) => a.order - b.order)
      for (const st of dieselStations) {
        stations.push({ type: ST, name: st.name, coords: st.latlng, distanceToNextPoint: st.distanceToNextPoint })
      }
    }
    stations.push({ type: WP, name: WP, coords: stationInfos[stationInfos.length - 1].fuelStations.destCoords, distanceToNextPoint: 0 })

    return stations
  })
}

const getPathAndDistanceFromRes = res => [
  pairs(res.response.route[0].shape),
  res.response.route[0].summary.distance
]

const findDieselStationsInVisitOrder = (stations, routeLinks) => {
  let order = 1
  const dieselStations = stations.filter(s => s.isDiesel)
  for (const l of routeLinks) {
    const linkId = Math.abs(Number(l.linkId))
    const linkStations = dieselStations.filter(s => s.junctionLinkId === linkId)
    if (linkStations.length === 1) {
      linkStations[0].order = order++
    } else if (linkStations.length > 1) {
      linkStations.sort((a, b) => a.distanceToReach - b.distanceToReach)
      for (const s of linkStations) s.order = order++
    }
  }

  dieselStations.sort((a, b) => a.order - b.order)
  return dieselStations
}

const extractStationsFromGeometries = geometries =>
  geometries.map(g => {
    const [lng, lat] = g.geometry
      .replace(/POINT \(([0-9. ]+)\)/, '$1')
      .split(' ')
    return {
      latlng: { lat: Number(lat), lng: Number(lng) },
      junctionLinkId: g.junctionLinkId,
      distanceToReach: g.distanceToReach,
      attributes: g.attributes,
      isDiesel: g.attributes.DIESEL && g.attributes.DIESEL.split(';')[0] === 'y',
      name: extractNames(g.attributes.NAMES)[0].text
    }
  })

const pairs = coorArr =>
  coorArr.reduce((acc, coor, i, shape) => {
    if (i % 2 === 1) acc.push([shape[i - 1], coor])
    return acc
  }, [])

const extractNames = str => {
  const ret = []
  const names = str.split('\u001D')
  for (var i = 0; i < names.length; i++) {
    const name = names[i]
    const nameTextSplit = name.split('\u001E')
    const nameText = nameTextSplit[0]
    const translit = nameTextSplit[1]
    const translitsObj = []
    const phoneme = nameTextSplit[2]
    const phonemesObj = []

    const languageCode = nameText.substring(0, 3)
    const nameType = nameText.substring(3, 4)
    const isExonym = nameText.substring(4, 5)
    const text = nameText.substring(5, nameText.length)

    if (translit) {
      const translits = translit.split(';')
      for (let j = 0; j < translits.length; j++) {
        const lcode = translits[j].substring(0, 3)
        const tr = translits[j].substring(3, translits[j].length)
        translitsObj.push({ languageCode: lcode, translit: tr })
      }
    }

    if (phoneme) {
      const phonemes = phoneme.split(';')
      for (let j = 0; j < phonemes.length; j++) {
        const lcode = phonemes[j].substring(0, 3)
        const pr = phonemes[j].substring(3, 4)
        const ph = phonemes[j].substring(4, phonemes[j].length)
        phonemesObj.push({ languageCode: lcode, prefered: pr, phoneme: ph })
      }
    }

    ret.push({ languageCode: languageCode, nameType: nameType, isExonym: isExonym, text: text, translits: translitsObj, phonemes: phonemesObj })
  }
  return ret
}