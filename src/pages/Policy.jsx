import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Policy.css";

const POLICY_DATA = {
  "/chinh-sach-doi-tra": {
    title: "Chính Sách Đổi Trả",
    update: "Cập nhật lần cuối: 01/2026",
    content: [
      {
        p: ["Chúng tôi luôn cam kết mang lại trải nghiệm mua sắm tốt nhất cho khách hàng. Chính sách đổi trả tại ShopRunner được xây dựng để đảm bảo quyền lợi của quý khách trong trường hợp sản phẩm không đáp ứng mong đợi hoặc gặp vấn đề về chất lượng."]
      },
      { 
        h3: "1. Điều kiện đổi trả", 
        p: ["Sản phẩm còn nguyên tem mác, chưa qua sử dụng trong vòng 7 ngày kể từ ngày nhận hàng.",
          "Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng.",
          "Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng, và còn đầy đủ hóa đơn, phụ kiện, tem mác đi kèm (nếu có).",
          "Chính sách đổi trả áp dụng với các sản phẩm mua trực tiếp trên website ShopRunner."
        ] 
      },
      { 
        h3: "2. Quy trình đổi trả", 
        /* Cấu trúc lại mảng p để in đậm các bước dễ dàng hơn */
        p: [
          "Bước 1 - Liên hệ hỗ trợ:"," Gọi tới hotline: 012345678 hoặc gửi email tới cskh@shoprunner.vn. Cung cấp thông tin về sản phẩm cần đổi trả bao gồm: mã đơn hàng, hình ảnh tình trạng sản phẩm và lý do đổi trả.",
          "Bước 2 - Xác nhận và hướng dẫn:"," Bộ phận chăm sóc khách hàng sẽ xác nhận yêu cầu trong vòng 1-2 ngày làm việc. Hướng dẫn gửi lại sản phẩm về kho sẽ được cung cấp cụ thể qua email hoặc hotline.",
          "Bước 3 - Gửi sản phẩm:"," Đóng gói sản phẩm cần đổi trả cẩn thận, kèm theo hóa đơn mua hàng. Gửi về địa chỉ kho của ShopRunner theo đúng hướng dẫn đã nhận.",
          "Bước 4 - Xử lý yêu cầu:"," Sau khi nhận và kiểm tra sản phẩm, chúng tôi sẽ thông báo kết quả đổi trả qua email hoặc tin nhắn. Thời gian xử lý đổi trả từ 3-5 ngày làm việc kể từ khi nhận sản phẩm."
        ] 
      },
      { 
        h3: "3. Chi phí vận chuyển", 
        p: ["Miễn phí đổi trả nếu lỗi từ phía nhà sản xuất. Các trường hợp khác, quý khách vui lòng thanh toán phí ship."] 
      }
    ]
  },
  "/chinh-sach-bao-hanh": {
    title: "Chính Sách Bảo Hành",
    update: "Cập nhật lần cuối: 01/2026",
    content: [
      {
        p: ["Chính sách bảo hành tại ShopRunner được xây dựng nhằm đảm bảo quyền lợi của khách hàng khi sử dụng các sản phẩm do chúng tôi cung cấp. Chúng tôi cam kết đồng hành cùng khách hàng trong suốt quá trình sử dụng sản phẩm."]
      },
      {
        h3: "1. Quy định chung",
        p: [
          "Tất cả các sản phẩm mua tại ShopRunner đều được bảo hành theo quy định của nhà sản xuất hoặc chính sách riêng của chúng tôi (nếu có).",
          "Thời gian bảo hành và các điều kiện cụ thể sẽ được ghi rõ trong phần mô tả sản phẩm hoặc trên phiếu bảo hành đi kèm.",
          "Chính sách chỉ áp dụng cho sản phẩm chính, không bao gồm quà tặng kèm hoặc phụ kiện ngoài danh mục bảo hành."
        ]
      },
      {
        h3: "2. Điều kiện bảo hành miễn phí",
        p: [
          "Lỗi kỹ thuật phát sinh từ nhà sản xuất (không phải lỗi do người dùng).",
          "Sản phẩm còn trong thời hạn bảo hành được quy định tại thời điểm mua hàng.",
          "Sản phẩm có đầy đủ hóa đơn, phiếu bảo hành, hoặc thông tin xác nhận mua hàng tại ShopRunner.",
          "Tem bảo hành, mã sản phẩm, hoặc serial sản phẩm còn nguyên vẹn, không bị rách hoặc tẩy xóa."
        ]
      },
      {
        h3: "3. Những trường hợp không được bảo hành",
        p: [
          "Sản phẩm hết thời hạn bảo hành.",
          "Hư hỏng do sử dụng không đúng cách, không tuân thủ hướng dẫn sử dụng của nhà sản xuất.",
          "Sản phẩm có dấu hiệu bị tháo lắp, sửa chữa bởi bên thứ ba không được ủy quyền.",
          "Sản phẩm bị hư hỏng do thiên tai, cháy nổ, ngập nước, va đập mạnh, hoặc sử dụng sai nguồn điện.",
          "Các bộ phận hao mòn tự nhiên (pin, dây cáp, đệm, lốp cao su, v.v.)."
        ]
      },
      {
        h3: "4. Quy trình bảo hành",
        p: [
          "Bước 1 - Liên hệ yêu cầu bảo hành:"," Gọi hotline 012345678 hoặc gửi email đến cskh@shoprunner.vn. Cung cấp mã đơn hàng, hình ảnh/clip mô tả lỗi và hóa đơn mua hàng.",
          "Bước 2 - Xác nhận yêu cầu bảo hành:"," Bộ phận chăm sóc khách hàng sẽ xác minh và phản hồi yêu cầu trong vòng 1-2 ngày làm việc.",
          "Bước 3 - Gửi sản phẩm bảo hành:"," Nếu đủ điều kiện, quý khách đóng gói sản phẩm cẩn thận và gửi về địa chỉ bảo hành theo hướng dẫn.",
          "Bước 4 - Xử lý bảo hành:"," Thời gian xử lý từ 7-14 ngày làm việc tùy thuộc vào mức độ lỗi của sản phẩm.",
          "Bước 5 - Trả sản phẩm:"," Sau khi hoàn tất sửa chữa, sản phẩm sẽ được gửi trả lại cho khách hàng."
        ]
      },
      {
        h3: "5. Hỗ trợ sau thời hạn bảo hành",
        p: ["Nếu sản phẩm hết hạn bảo hành, chúng tôi hỗ trợ sửa chữa với chi phí ưu đãi. Khách hàng sẽ được thông báo rõ về chi phí trước khi thực hiện."]
      }
    ]
  },
  "/chinh-sach-bao-mat": {
    title: "Chính Sách Bảo Mật",
    update: "Cập nhật lần cuối: 01/2026",
    content: [
      {
        p: ["ShopRunner cam kết bảo vệ quyền riêng tư và thông tin cá nhân của khách hàng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn khi mua sắm tại hệ thống."]
      },
      {
        h3: "1. Thu thập thông tin cá nhân",
        p: [
          "Thông tin định danh: Họ tên, số điện thoại, email và địa chỉ giao hàng.",
          "Thông tin thanh toán: Chi tiết giao dịch và thông tin thẻ (được mã hóa bởi đơn vị thanh toán).",
          "Dữ liệu truy cập: Địa chỉ IP, loại thiết bị, trình duyệt và lịch sử mua hàng để cải thiện trải nghiệm người dùng."
        ]
      },
      {
        h3: "2. Mục đích sử dụng thông tin",
        p: [
          "Xử lý đơn hàng, giao nhận và cung cấp dịch vụ hậu mãi (bảo hành, đổi trả).",
          "Hỗ trợ giải đáp thắc mắc và xử lý khiếu nại của khách hàng.",
          "Gửi thông tin cập nhật về sản phẩm mới và chương trình khuyến mãi (khi có sự đồng ý của khách hàng)."
        ]
      },
      {
        h3: "3. Chia sẻ thông tin",
        p: [
          "Chúng tôi chỉ chia sẻ thông tin cần thiết với các đơn vị vận chuyển (GHTK, Viettel Post...) và đối tác thanh toán để hoàn tất đơn hàng.",
          "Cung cấp thông tin theo yêu cầu của cơ quan pháp luật có thẩm quyền theo quy định của Việt Nam.",
          "Tuyệt đối không bán hoặc trao đổi thông tin khách hàng cho bên thứ ba vì mục đích thương mại."
        ]
      },
      {
        h3: "4. Quyền của khách hàng",
        p: [
          "Truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân bất kỳ lúc nào thông qua tài khoản trực tuyến hoặc liên hệ hotline.",
          "Từ chối nhận các thông tin quảng cáo, tiếp thị bằng cách nhấn 'Hủy đăng ký' trong email hoặc tin nhắn."
        ]
      },
      {
        h3: "5. Thời gian lưu trữ và Bảo mật",
        p: [
          "Thông tin tài khoản được lưu trữ trọn đời cho đến khi có yêu cầu xóa từ khách hàng.",
          "Dữ liệu giao dịch được lưu trữ tối thiểu 3 năm để phục vụ công tác đối soát và pháp lý.",
          "Mọi dữ liệu truyền tải đều được mã hóa theo chuẩn SSL và kiểm soát quyền truy cập nghiêm ngặt."
        ]
      },
      {
        h3: "6. Quy trình giải quyết khiếu nại bảo mật",
        p: [
          "Bước 1 - Tiếp nhận:"," Khách hàng gửi phản hồi qua hotline 012345678 hoặc email cskh@shoprunner.vn.",
          "Bước 2 - Xác minh:"," Chúng tôi sẽ xác nhận tiếp nhận khiếu nại trong vòng 48 giờ làm việc.",
          "Bước 3 - Xử lý: ","Đội ngũ kỹ thuật và pháp chế sẽ điều tra và đưa ra giải pháp xử lý trong vòng 7 ngày làm việc.",
          "Bước 4 - Phản hồi:"," Kết quả xử lý sẽ được thông báo chính thức qua email của khách hàng."
        ]
      }
    ]
  }
};

function Policy() {
  const { pathname } = useLocation();
  const data = POLICY_DATA[pathname];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!data) {
    return <div className="policy-container"><h1 style={{color: 'white'}}>Trang không tồn tại</h1></div>;
  }

  // Hàm helper để render đoạn văn, in đậm nếu nó bắt đầu bằng "Bước X -"
  const renderParagraph = (paragraph, index) => {
    // Kiểm tra nếu đoạn văn là chuỗi và bắt đầu bằng "Bước X -"
    const match = paragraph.match(/^(Bước \d+ - [^:]+:)(.*)$/);
    if (match) {
      // In đậm phần bước và render phần còn lại thường
      return (
        <p key={index}>
          <strong>{match[1]}</strong>{match[2]}
        </p>
      );
    }
    // Nếu không phải, render thường
    return <p key={index}>{paragraph}</p>;
  };

  return (
    <div className="policy-wrapper">
      <div className="policy-container">
        <h1 className="policy-title">{data.title}</h1>
        <p className="policy-date">{data.update}</p>
        
        <div className="policy-content">
          {data.content.map((section, index) => (
            <div key={index} className="policy-section">
              {/* Chỉ hiện h3 nếu nó tồn tại */}
              {section.h3 && <h3>{section.h3}</h3>}
              
              {/* Sử dụng hàm helper để render từng dòng thẻ <p> */}
              {section.p.map((paragraph, i) => renderParagraph(paragraph, i))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Policy;