
import axiosClient from "../api/axiosClient";

const paymentService = {
    async create (contract_id, option, finalAmount){
        const res = await axiosClient.post("create_vnpay_payment/", {
            contract_id: contract_id, 
            payment_type: option,
            amount: finalAmount
        });
        return res.data;
    }
}
export default paymentService;