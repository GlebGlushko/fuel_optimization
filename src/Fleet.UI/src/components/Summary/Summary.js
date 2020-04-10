import React from 'react'
import { Paper } from '@material-ui/core'

import { Table } from '../Table'
export class Summary extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      distance: 1000,
      volume: 100,
      cost: 145,
      saved: 12
    }
  }

  componentDidMount () {

  }

  render () {
    const { classes, trip, info } = this.props
    const { distance } = info || {}
    const rows = [{ name: 'Total Distance', value: distance && (distance / 1000).toFixed(2).toString() + 'km' }]
    if (trip && trip.optimizedPoints) {
      const { totalFuel, totalCost } = calcVolumeAndCost(trip.optimizedPoints)
      rows.push(
        { name: 'Consumed fuel', value: totalFuel.toFixed(2).toString() + 'L' },
        { name: 'Total cost', value: totalCost.toFixed(2).toString() + '€' }
      )
    }
    console.log(rows)
    return (
      <Paper className={classes.summaryContainer}>
        <Table
          rows={rows}
        />
      </Paper>

    )
  }
}
const calcVolumeAndCost = (points) => {
  console.log('ebo')
  let totalFuel = 0
  let totalCost = 0
  points = points.filter(p => p.type === 2)

  for (let i = 0; i < points.length; ++i) {
    totalFuel += points[i].refuel
    totalCost += points[i].refuel * points[i].cost
  }
  return { totalFuel, totalCost }
}

/*

total distance
total fuel volume
total cost
saved cost

*/