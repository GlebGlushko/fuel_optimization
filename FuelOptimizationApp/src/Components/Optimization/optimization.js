import React from 'react';
import Route from '../Route/route';
import TruckPicker from '../TruckPicker/TruckPicker'

class Optimization extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            selectedTruck : null,
            points: null,
            
        }

    }
    componentDidMount(){
        this.setState({points:[
            {
                mapData: 'mapData1',
                name: 'Ukraine',
                orders: [
                    {
                        selectedBrand: { value: 0, label: 'Renault'},
                        selectedModel: {value: 0, label: 'Logan'},
                        number: 4
                    },
                ],
                position: [50.393219, 30.488314],
                locationId: 'NT_s5uXPmqbNH4pCOzMAorV.C'                
            },
            {
                mapData: 'mapData2',
                name: 'England',
                orders: [
                    {
                        selectedBrand: { value: 0, label: 'Nissan'},
                        selectedModel: {value: 0, label: 'X-Trail'},
                        number: 2
                    },
                ],
                position: [51.797901, 11.198762],
                locationId: 'NT_Bn2nZIGG5u7l6Vv2n9z9AD',
            }
        ]});
    }
    handleTruckChanged = (truck) =>{
        this.setState({selectedTruck: truck});
    }
    
    handleOrderChanged = (pointId, orderId, newOrder ) =>{
        this.setState({
            points: [...this.state.points.slice(0,pointId),
                    {
                        ...this.state.points[pointId],
                        orders: [...this.state.points[pointId].orders.slice(0,orderId),
                                newOrder,
                                ...this.state.points[pointId].orders.slice(orderId+1)]
                    } ,
                    ...this.state.points.slice(pointId+1)]
        })
    }
    handleOrderAdded = (pointId) => {
        this.setState({
            points: [...this.state.points.slice(0,pointId),
                    {...this.state.points[pointId],
                     orders: [...this.state.points[pointId].orders, {
                                                            selectedBrand: null,
                                                            selectedModel: null,
                                                            number: 1
                                                        }]
                    },
                    ...this.state.points.slice(pointId+1)]
        });
    }
    handleOrderDeleted = (pointId, orderId) => {
        this.setState({points:
                        [...this.state.points.slice(0,pointId),
                            {...this.state.points[pointId],
                            orders: [...this.state.points[pointId].orders.slice(0,orderId),
                                    ...this.state.points[pointId].orders.slice(orderId+1)]
                        },
                        ...this.state.points.slice(pointId+1)]
        })
    }
    handlePointAdded = () =>{
        this.setState({points:[...this.state.points, {
            mapData: 'mapData'+this.state.points.length,
            name: '',
            coordinates: {
                GpsLatitude: null,
                GpsLongitude: null
            },
            orders: [
                {
                    selectedBrand: null,
                    selectedModel: null,
                    number: 1
                },
            ]}]});
    }
    handlePointDeleted = (pointId) => {
        this.setState({points:
                            [...this.state.points.slice(0,pointId),
                            ...this.state.points.slice(pointId+1)]});
    }
    handleLocationIdChanged = (pointId, locationId)=>{
        let app_id = 'fLR4pqJX0jZZZle8nwaM';
        let app_code = 'eM1d0zQLOLaA44cULr6NwQ';
        let url = 'http://geocoder.api.here.com/6.2/geocode.json';
        fetch(`${url}?locationId=${locationId}&app_id=${app_id}&&app_code=${app_code}`, {
            method: 'GET',
            mode: 'cors'
        }).then(response => {
            return response.json();
        }).then( json =>{
            let pos = json.Response.View[0].Result[0].Location.DisplayPosition;
            this.setState({points:[
                ...this.state.points.slice(0,pointId),
                {
                    ...this.state.points[pointId],
                    locationId: locationId,
                    position: [pos.Latitude, pos.Longitude]
                },
                ...this.state.points.slice(pointId+1)
            ]})
        });


        // let obj = JSON.parse(JSON.stringify(this.state.points[pointId]));//.locationId;
        // obj.locationId = locationId;
        
    }
    render(){
        return (
        <div>
            <TruckPicker handleTruckChanged = {this.handleTruckChanged}/>
            <Route 
                points= {this.state.points} 
                handleOrderChanged = {this.handleOrderChanged}
                handleOrderAdded = {this.handleOrderAdded}
                handleOrderDeleted = {this.handleOrderDeleted}
                handlePointAdded = {this.handlePointAdded}
                handlePointDeleted = {this.handlePointDeleted}
                handleLocationIdChanged = {this.handleLocationIdChanged}
                />
        </div>
        );
    }

}

export default Optimization;