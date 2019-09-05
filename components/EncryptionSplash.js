import React from 'react'
import { ActivityIndicator, YellowBox, View, Text } from 'react-native'
import * as firebaseHandler from '../Firebase/FirebaseHandler'
import BigInt from 'big-integer'
import * as JPAKE from '../JPAKE/JPakeOperations'
import firebaseDB from '../Firebase/FirebaseDB'
import {PrimeOrderGroup} from '../JPAKE/PrimeOrderGroup'
import CryptoJS from "crypto-js";
import * as asyncstore from '../AsyncStorage/Store'
import Dialog from "react-native-dialog"
import 'react-native-console-time-polyfill';

export default class EncryptionSplash extends React.Component {
    _isMounted = false;

    // Remove header
    static navigationOptions = {
        header: null,
    }

    constructor(props) {
        super(props)
        YellowBox.ignoreWarnings(['Setting a timer']);
        alertPresent = ''
        secret= ''
        alertPresent = false
        p = BigInt(),
        q = BigInt(),
        g = BigInt(),
        x1 = BigInt(),
        x2 = BigInt(),
        gx1 = BigInt(),
        gx2 = BigInt(),
        gx3 = BigInt(),
        gx4 = BigInt(),
        B = BigInt(),
        keyingMaterial = '',
        label = 'key exchange',
        cancelled = ''
    }

    state = {
        status: '',
        dialogVisible: false,
        gx1: BigInt()
    }

    // Simple function to display the password dialog prompt
    showDialog = () => {
        if (this._isMounted) {
            this.setState({ dialogVisible: true });
        }
    };

    // Simple function to hide the password dialog prompt
    hideDialog = async () => {
        if (this._isMounted) {
            await this.setState({ dialogVisible: false });
        }
    }

    // Function that handles the "Cancel" button on the password prompt to signal end of protocol
    handleCancel = async () => {
        this.cancelled = 1
        this.hideDialog()
        const {connectionURL} = this.props.navigation.state.params
        await firebaseHandler.pushRequestConnection(connectionURL, false)
    };

    // Function that handles the "OK" button to initiate the key exchange protocol
    handleOK = async() => {
        const {connectionURL, user, toUserName, toUserID} = this.props.navigation.state.params
        // Close the password dialog
        if (this._isMounted) {
            this.hideDialog()
            this.setState({status:'Encrypting Session'})
        }
        // Setting a delay before key exchange function to allow the password dialog to close properly
        setTimeout(() =>{   
            this.KeyExchange(connectionURL, user, toUserName, toUserID)
        }, 1000)
    };

    // Render function used render the view with loading bar and password prompt
    render() {
        const {status} = this.state
        return (
          <View style={styles.viewStyles}>
            <Text style={styles.textStyles}>
                {status}
            </Text>
            <ActivityIndicator size='large' color='black' />
            <Dialog.Container visible={this.state.dialogVisible}>
                <Dialog.Title>Password Required</Dialog.Title>
                <Dialog.Description>
                Please enter a pre-determined password with the user for encryption
                </Dialog.Description>
                <Dialog.Input onChangeText={(password) => this.secret = password}></Dialog.Input>
                <Dialog.Button label="Cancel" onPress={this.handleCancel} />
                <Dialog.Button label="OK" onPress={() => this.handleOK()} />
            </Dialog.Container>
          </View>
        );
    }
    // This function is called as soon as this component is loaded
    async componentDidMount() {
        this._isMounted = true
        const {status, connectionURL} = this.props.navigation.state.params
        //Status 0 being the user that is request the session i.e Alice
        if (status == 0) {
            this.setState({status: 'Requesting session'})
            //Listen for request permission
            firebaseDB.database().ref(connectionURL).on('child_added', async function(snap){
                let {request} = snap.val()
                //If received true, it signals permission granted proceed to begin protocol by prompting the user to enter a password
                if (request == true) {
                    this.showDialog()
                }
                //If received a false request from database, abort protocol
                else if (request == false) {
                    await this.hideDialog()
                    if (!this.alertPresent && this._isMounted) {
                        this.alertPresent = true;
                        if (this.cancelled != 1){
                            setTimeout(() =>{
                                alert(this.props.navigation.state.params.toUserName+' declined the session')
                            }, 500)
                            this.cancelled = 0
                        }
                        this.props.navigation.navigate('Contacts')
                    }
                    this.alertPresent = false
                    firebaseDB.database().ref(connectionURL).remove()
                }
            }.bind(this));
        //Status 0 is the user that is receiving the session i.e Bob
        } else if (status == 1){
            this.showDialog()
            firebaseDB.database().ref(connectionURL).on('child_added', async function(snap){
                let {request} = snap.val()
                //Abort protocol if a false request is heard from database.
                if (request == false) {
                    await this.hideDialog()
                    if (!this.alertPresent && this._isMounted) {
                        this.alertPresent = true;
                        if (this.cancelled != 1){
                            setTimeout(() =>{
                                alert(this.props.navigation.state.params.toUserName+' declined the session')
                            }, 500)
                            this.cancelled = 0
                        }
                        this.props.navigation.navigate('Contacts')
                    }
                    
                    this.alertPresent = false
                    firebaseDB.database().ref(connectionURL).remove()
                }
            }.bind(this));
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    // Function that handles the whole protocol
    KeyExchange = async(connectionURL, user, toUserName, toUserID) =>{
        console.time('Key Exchange')
        this.p = PrimeOrderGroup().p
        this.q = PrimeOrderGroup().q
        this.g = PrimeOrderGroup().g

        // Convert password/secret to s (Big integer object)
        this.s = JPAKE.generateS(this.secret)
        
        // Generate x1 and x2
        this.x1 = JPAKE.generateX1(this.q)
        this.x2 = JPAKE.generateX2(this.q)

        // Compute Gx1 and Gx2
        this.gx1 = JPAKE.computeGX(this.p, this.g, this.x1)
        this.gx2 = JPAKE.computeGX(this.p, this.g, this.x2)

        // Compute Zero Knowledge Proof for x1 and x2
        const zkpx1 = JPAKE.computeZeroKnowledgeProof(this.p, this.q, this.g, this.gx1.toString(), this.x1, user._id)
        const zkpx2 = JPAKE.computeZeroKnowledgeProof(this.p, this.q, this.g, this.gx2.toString(), this.x2, user._id)

        // Initialise round 1 payload to a JavaScript object
        const roundOnePayload = {
            id: user._id,
            gx1: this.gx1.toString(),
            gx2: this.gx2.toString(),
            zkpx1: zkpx1,
            zkpx2: zkpx2,
            round: 1
        }
        // Send round 1 payload onto firebase database
        await firebaseHandler.pushPayloadConnection(connectionURL+'/Payloads/', roundOnePayload)

        // Listening for payloads
        await firebaseDB.database().ref(connectionURL+'/Payloads/').on('child_added', async function(snap) {
            const {payload} = snap.val()
            // When receiving payload 1 from the other uer
            if (payload.id != user._id && payload.round == 1) {
                this.gx3 = payload.gx1
                this.gx4 = payload.gx2
                
                // Validate knowledge proofs for x1 and x2 from payload
                const validzkpx1 = JPAKE.validateZeroKnowledgeProof(this.p, this.q, this.g, this.gx3, payload.zkpx1, payload.id)
                const validzkpx2 = JPAKE.validateZeroKnowledgeProof(this.p, this.q, this.g, this.gx4, payload.zkpx2, payload.id)

                // If either one of the validation fails, end protocol by sending a false signal to database and return to contacts screen
                if (!(validzkpx1 && validzkpx2)){
                    console.log(user.name, 'Round 1 validation unsuccessful')
                    firebaseDB.database().ref(connectionURL).off()
                    this.props.navigation.navigate('Contacts')
                    await firebaseHandler.pushRequestConnection(connectionURL, false)
                    return
                // Otherwise, prompt success in console and continue with protocol
                } else {
                    console.log(user.name, 'successfully validated round 1 payload')
                }

                //Compute payloads for round 2
                const ga = JPAKE.computeGA(this.p, this.gx1, this.gx3, this.gx4)
                const x2s = JPAKE.computeX2S(this.q, this.x2, this.s)
                const a = JPAKE.computeA(ga, this.p, x2s)
                const zkpx2s = JPAKE.computeZeroKnowledgeProof(this.p, this.q, ga, a, x2s, user._id)

                const roundTwoPayload = {
                    id: user._id,
                    a: a.toString(),
                    zkpx2s: zkpx2s,
                    round: 2
                }

                // Push round 2 payload to database
                await firebaseHandler.pushPayloadConnection(connectionURL+'/Payloads', roundTwoPayload)
            }
            // When Receiving payload 2 from the other user
            else if (payload.id != user._id && payload.round == 2) {
                // Compute Keying material and
                const gb = JPAKE.computeGA(this.p,BigInt(this.gx3),BigInt(this.gx1),BigInt(this.gx2))
                const validzkpx4s = JPAKE.validateZeroKnowledgeProof(this.p, this.q, gb, payload.a, payload.zkpx2s, payload.id)

                // Check if verification of zero knowledge proof return true or false, indicating whether it failed or not.
                if (!(validzkpx4s)){
                    console.log(user.name,'Round 2 validation unsucessful')
                    this.props.navigation.navigate('Contacts')
                    await firebaseHandler.pushRequestConnection(connectionURL, false)
                    return
                }else{
                    console.log(user.name,'successfully validated round 2 payload')
                }

                // Compute keying material
                this.keyingMaterial = JPAKE.computeKeyingMaterial(this.p, this.g, this.gx4, this.x2, this.s, payload.a).toString()

                // Compute Hash MAC code
                const hmacCode = JPAKE.computeHMACVerification(this.keyingMaterial, this.gx1, this.gx2, this.gx3, this.gx4).toString()
                
                // Initialise round 3 payload
                const round3Payload = {
                    id: user._id,
                    hmac: hmacCode,
                    round: 3,
                }
                
                // Push key confirmation payload
                await firebaseHandler.pushPayloadConnection(connectionURL+'/Payloads', round3Payload)

            } 
            // When Receiving payload 3 from the otehr user
            else if (payload.id != user._id && payload.round == 3){

                // Verify HMAC code using data received from the exchange of round 1 and 23
                if (await JPAKE.computeHMACVerification(this.keyingMaterial, this.gx3, this.gx4, this.gx1, this.gx2).toString() == payload.hmac.toString()){
                    const sessionKey = CryptoJS.SHA256(this.keyingMaterial.toString())
                    asyncstore.storeItem('@Key:'+user._id+':'+toUserID, sessionKey.toString())
                    this.props.navigation.navigate('Chat',{
                        user: user,
                        toUserName: toUserName,
                        toUserID: toUserID,
                        sessionKey: sessionKey.toString()
                    })
                    console.timeEnd("Key Exchange")
                }
                // If verification fails, return back to the contacts screen. 
                else {
                    alert('Key validation failed.')
                    this.props.navigation.navigate('Contacts')
                }
                // Remove secret and keying material
                this.secret = ''
                this.keyingMaterial = ''

                // Stop listening to connection and remove any data in connection.
                firebaseDB.database().ref(connectionURL).off()
                firebaseDB.database().ref(connectionURL).remove()
            }
        }.bind(this));
    }
}
const styles = {
    viewStyles: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white'
    },
    textStyles: {
      color: 'black',
      fontSize: 25,
      fontWeight: 'bold',
      marginBottom:20,
    }
}